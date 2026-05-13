import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { Request, Response } from "express"
import { asyncHandler } from "../utils/asyncHandler"
import { IUser, User } from "../models/User"
import { ApiResponse } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { Team } from "../models/Team";
import { RecentActivity } from "../models/recentActivities"

interface AuthRequest extends Request {
  user?: IUser;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const {
    userType = "",
    firstName = "",
    lastName = "",
    leadFirstName = "",
    leadLastName = "",
    email = "",
    leadEmail = "",
    phone = "",
    leadPhone = "",
    address = "",
    qualification = "",
    experience = "",
    password = "",
    teamName,
    teamMembers = [],
  } = req.body;

  const name = `${firstName} ${lastName}`.trim();

  let emailsToCheck: string[] = [];
  if (userType !== "team_lead") {
    if (email) emailsToCheck.push(email);
  } else {
    if (leadEmail) emailsToCheck.push(leadEmail);
    if (teamMembers?.length) {
      emailsToCheck.push(...teamMembers.map((m: { email: string }) => m.email));
    }
  }

  if (emailsToCheck.length) {
    const existingUser = await User.findOne({ email: { $in: emailsToCheck } });
    if (existingUser) {
      throw new ApiError(400, `User with email ${existingUser.email} already exists`);
    }
  }

  if (userType !== "team_lead") {
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password || "")) {
      throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
    }

    const hashedPassword = await bcrypt.hash(password || "", 10);

    const data = await User.create({
      userType,
      email,
      password: hashedPassword,
      profile: {
        name,
        phone,
        address,
        qualification,
        experience,
        profileImage: "",
      },
    });

    if (userType === "evaluator") {
      await RecentActivity.create({
        title: `Evaluator ${name} Registered Successfully`,
      });
    }

    return res
      .status(200)
      .json(new ApiResponse(true, "User registered successfully", data));
  }

  const existingTeam = await Team.findOne({ teamName });
  if (existingTeam) {
    throw new ApiError(400, "Team name already exists");
  }

  const leadName = `${leadFirstName} ${leadLastName}`.trim();

  // Validate password strength for team lead
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    throw new ApiError(400, "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character");
  }

  const hashedLeadPassword = await bcrypt.hash(password, 10);
  const teamLead = await User.create({
    userType: "team_lead",
    email: leadEmail,
    password: hashedLeadPassword,
    profile: {
      name: leadName,
      phone: leadPhone,
      address,
      qualification,
      experience,
      profileImage: "",
    },
  });

  const memberUsers = await Promise.all(
    teamMembers.map(async (member: { name: string; email: string }) => {
      const memberPassword = await bcrypt.hash("12345678", 10);
      const createdMember = await User.create({
        userType: "team_member",
        email: member.email,
        password: memberPassword,
        profile: {
          name: member.name,
          profileImage: "",
        },
      });

      return createdMember;
    })
  );

  const team = await Team.create({
    teamName,
    teamLeadId: teamLead._id,
    members: memberUsers.map((m) => m._id),
    totalMembers: memberUsers.length + 1,
  });

  const formattedTitle =
    teamName.split(" ")[0].toLowerCase() === "team"
      ? `${teamName} Registered Successfully`
      : `Team ${teamName} Registered Successfully`;

  await RecentActivity.create({
    title: formattedTitle,
  });


  return res.status(201).json(
    new ApiResponse(true, "Team registered successfully", {
      teamLead,
      members: memberUsers,
      team,
    })
  );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, userType } = req.body;

  // 1. Check if user exists
  const user = await User.findOne({ email, userType });
  if (!user) {
    throw new ApiError(400, "User not found");
  }

  if (userType === "evaluator") {
    const user = await User.findOne({ email, userType, isApproved: true });
    if (!user) {
      throw new ApiError(400, "Evaluator not approved");
    }
  }

  // 2. Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid password");
  }

  // 3. Generate JWT
  const token = jwt.sign(
    { id: user._id, role: user.userType },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  // 4. Set cookie
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",             
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 5. Remove unwanted fields before sending user
  const { password: _, evaluationStats, isApproved, isActive, ...userData } = user.toObject();

  // 6. Send response
  res.status(200).json(
    new ApiResponse(
      true,
      "Login successful",
      userData
    )
  );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === "production";

  res.clearCookie("token", {
    httpOnly: false,
    secure: isProd,           
    sameSite: isProd ? "none" : "lax",
    path: "/",               
  });

  res.status(200).json(new ApiResponse(true, "Logout successful"));
});

export const profile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Destructure unwanted fields out
  const { password, isApproved, isActive, ...userWithoutSensitive } = user;

  // If evaluator, keep evaluationStats, else remove it
  if (user.userType !== "evaluator") {
    delete userWithoutSensitive.evaluationStats;
  }

  // For team users only — check if their team has submitted a video
  let isVideoSubmitted: boolean | undefined;

  if (user.userType === "team_lead" || user.userType === "team_member") {
    const team = await Team.findOne({
      $or: [
        { teamLeadId: user._id },
        { members: user._id },
      ],
    }).select("status").lean();

    isVideoSubmitted = team?.status === "submitted";
  }

  return res.status(200).json(
    new ApiResponse(
      true,
      "Profile fetched successfully",
      {
        ...userWithoutSensitive,
        ...(isVideoSubmitted !== undefined && { isVideoSubmitted }),
      }
    )
  );
});

export const allUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userType = req.query.userType as string;

  const id = req.query.id as string;

  const query: any = {};

  if (userType) {
    query.userType = userType;
  }

  if (id) {
    query._id = id;
  }

  const users = await User.find(query).lean();

  return res.status(200).json(
    new ApiResponse(
      true,
      "Users fetched successfully",
      users
    )
  );
});

export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).lean();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const { password, isApproved, isActive, ...userData } = user;

  if (user.userType !== "evaluator") {
    delete userData.evaluationStats;
  }

  return res.status(200).json(
    new ApiResponse(
      true,
      "Profile fetched successfully",
      userData
    )
  );
});





