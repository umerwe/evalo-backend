import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { fetchResultStatus, updateResultStatus } from "./result.service";

export const setResultStatus = asyncHandler(
    async (req: Request, res: Response) => {
        const { status } = req.body;
        const data = await updateResultStatus(status);

        return res.json(data);
    }
);

export const getResult = asyncHandler(async (req: Request, res: Response) => {
    const data = await fetchResultStatus();

    return res.json(data);
});
