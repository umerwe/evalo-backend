import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../config/env";
import { RecentActivity } from "../../models/recentActivities";
import { Team } from "../../models/Team";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";

export const registerUser = async (body: any) => {
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
    } = body;

    const name = `${firstName} ${lastName}`.trim();

    let emailsToCheck: string[] = [];
    if (userType !== "team_lead") {
        if (email) emailsToCheck.push(email);
    } else {
        if (leadEmail) emailsToCheck.push(leadEmail);
        if (teamMembers?.length) {
            emailsToCheck.push(
                ...teamMembers.map((m: { email: string }) => m.email)
            );
        }
    }

    if (emailsToCheck.length) {
        const existingUser = await User.findOne({ email: { $in: emailsToCheck } });
        if (existingUser) {
            throw new ApiError(
                400,
                `User with email ${existingUser.email} already exists`
            );
        }
    }

    if (userType !== "team_lead") {
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password || "")) {
            throw new ApiError(
                400,
                "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
            );
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

        return { statusCode: 200, message: "User registered successfully", data };
    }

    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
        throw new ApiError(400, "Team name already exists");
    }

    const leadName = `${leadFirstName} ${leadLastName}`.trim();

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        throw new ApiError(
            400,
            "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
        );
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

    return {
        statusCode: 201,
        message: "Team registered successfully",
        data: {
            teamLead,
            members: memberUsers,
            team,
        },
    };
};

export const loginUser = async (body: any) => {
    const { email, password, userType } = body;

    const user = await User.findOne({ email, userType });
    if (!user) {
        throw new ApiError(400, "User not found");
    }

    if (userType === "evaluator") {
        const userApproved = await User.findOne({
            email,
            userType,
            isApproved: true,
        });
        if (!userApproved) {
            throw new ApiError(400, "Evaluator not approved");
        }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(400, "Invalid password");
    }

    const token = jwt.sign(
        { id: user._id, role: user.userType },
        config.jwtSecret!,
        { expiresIn: "7d" }
    );

    const { password: _, evaluationStats, isApproved, isActive, ...userData } =
        user.toObject();

    return {
        user: userData,
        token,
    };
};

export const fetchProfile = async (userId: any) => {
    const user = await User.findById(userId).lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { password, isApproved, isActive, ...userWithoutSensitive } = user;

    if (user.userType !== "evaluator") {
        delete userWithoutSensitive.evaluationStats;
    }

    let isVideoSubmitted: boolean | undefined;

    if (user.userType === "team_lead" || user.userType === "team_member") {
        const team = await Team.findOne({
            $or: [{ teamLeadId: user._id }, { members: user._id }],
        })
            .select("status")
            .lean();

        isVideoSubmitted = team?.status === "submitted";
    }

    return {
        ...userWithoutSensitive,
        ...(isVideoSubmitted !== undefined && { isVideoSubmitted }),
    };
};

export const fetchAllUsers = async (queryParams: any) => {
    const userType = queryParams.userType as string;
    const id = queryParams.id as string;

    const query: any = {};

    if (userType) {
        query.userType = userType;
    }

    if (id) {
        query._id = id;
    }

    return User.find(query).lean();
};

export const fetchCurrentUser = async (userId: any) => {
    const user = await User.findById(userId).lean();

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const { password, isApproved, isActive, ...userData } = user;

    if (user.userType !== "evaluator") {
        delete userData.evaluationStats;
    }

    return userData;
};
