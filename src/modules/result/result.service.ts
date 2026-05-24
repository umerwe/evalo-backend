import { Result } from "../../models/Result";

export const updateResultStatus = async (status: string) => {
    const isPublished = status === "true";

    let result = await Result.findOne();

    if (!result) {
        result = await Result.create({
            isPublished,
        });
    } else {
        result.isPublished = isPublished;
        await result.save();
    }

    return {
        message: `Result is now ${isPublished ? "Published" : "Unpublished"}`,
        isPublished: result.isPublished,
    };
};

export const fetchResultStatus = async () => {
    const result = await Result.findOne();

    return {
        isPublished: result?.isPublished ?? false,
    };
};
