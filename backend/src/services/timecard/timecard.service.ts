import { Request, Response } from "express";
import { prismaClient } from "../../prisma";
import { sendErrorResponse, sendSuccessResponse } from "../../lib/sendResponse";

class timecardService {
    public static async start(req: Request, res: Response) {
        const userId = req.user?.userId;
        if (!userId) return sendErrorResponse(res, "UNAUTHORIZED");
        try {
            const existing = await prismaClient.timeCard.findFirst({
                where: { userId, endTime: null },
            });
            if (existing) {
                return sendErrorResponse(res, "CONFLICT");
            }
            const card = await prismaClient.timeCard.create({
                data: { userId, startTime: new Date() },
            });
            return sendSuccessResponse(res, "CREATED", { data: card });
        } catch (error) {
            console.error("Error starting timecard:", error);
            return sendErrorResponse(res);
        }
    }

    public static async pause(req: Request, res: Response) {
        const userId = req.user?.userId;
        if (!userId) return sendErrorResponse(res, "UNAUTHORIZED");
        try {
            const card = await prismaClient.timeCard.findFirst({
                where: { userId, endTime: null, pauseTime: null },
            });
            if (!card) {
                return sendErrorResponse(res, "NOT_FOUND");
            }
            await prismaClient.timeCard.update({
                where: { id: card.id },
                data: { pauseTime: new Date() },
            });
            return sendSuccessResponse(res);
        } catch (error) {
            console.error("Error pausing timecard:", error);
            return sendErrorResponse(res);
        }
    }

    public static async resume(req: Request, res: Response) {
        const userId = req.user?.userId;
        if (!userId) return sendErrorResponse(res, "UNAUTHORIZED");
        try {
            const card = await prismaClient.timeCard.findFirst({
                where: { userId, endTime: null, pauseTime: { not: null }, resumeTime: null },
            });
            if (!card) {
                return sendErrorResponse(res, "NOT_FOUND");
            }
            await prismaClient.timeCard.update({
                where: { id: card.id },
                data: { resumeTime: new Date() },
            });
            return sendSuccessResponse(res);
        } catch (error) {
            console.error("Error resuming timecard:", error);
            return sendErrorResponse(res);
        }
    }

    public static async stop(req: Request, res: Response) {
        const userId = req.user?.userId;
        if (!userId) return sendErrorResponse(res, "UNAUTHORIZED");
        try {
            const card = await prismaClient.timeCard.findFirst({
                where: { userId, endTime: null },
            });
            if (!card) {
                return sendErrorResponse(res, "NOT_FOUND");
            }
            await prismaClient.timeCard.update({
                where: { id: card.id },
                data: { endTime: new Date() },
            });
            return sendSuccessResponse(res);
        } catch (error) {
            console.error("Error stopping timecard:", error);
            return sendErrorResponse(res);
        }
    }

    public static async history(req: Request, res: Response) {
        const userId = req.user?.userId;
        if (!userId) return sendErrorResponse(res, "UNAUTHORIZED");
        try {
            const cards = await prismaClient.timeCard.findMany({
                where: { userId },
                orderBy: { startTime: "desc" },
            });
            return sendSuccessResponse(res, "OK", { data: cards });
        } catch (error) {
            console.error("Error fetching history:", error);
            return sendErrorResponse(res);
        }
    }
}

export default timecardService;
