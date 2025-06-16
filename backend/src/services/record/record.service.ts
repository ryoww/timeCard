import { Request, Response } from "express";
import fs from "fs/promises";
import { sendErrorResponse, sendSuccessResponse } from "../../lib/sendResponse";
import { prismaClient } from "../../prisma";
import { endOfMonth, startOfMonth } from "date-fns";

class recordService {
    public static async createReceipt(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            const { tempReceiptId, store, date, total, change, method, items, categoryId } =
                req.body;

            const temp = await prismaClient.tempReceipt.findUnique({
                where: {
                    id: tempReceiptId,
                },
                include: {
                    items: true,
                },
            });

            if (!temp || temp.userId !== userId) {
                return sendErrorResponse(res, "NOT_FOUND");
            }

            if (!tempReceiptId || !store || !date || !total || !change || !method || !items) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            let createRecord;

            await prismaClient.$transaction(async (tx) => {
                createRecord = await tx.record.create({
                    data: {
                        store: store,
                        date: date,
                        total: total,
                        change: change,
                        method: method ?? undefined,
                        userId: userId,
                        categoryId: categoryId ?? undefined,
                        items: {
                            create: items.map((item: any) => ({
                                name: item.name,
                                price: item.price,
                            })),
                        },
                    },
                    include: {
                        items: true,
                    },
                });

                await tx.tempReceipt.delete({
                    where: {
                        id: tempReceiptId,
                    },
                });
            });

            if (temp.imagePath) {
                try {
                    await fs.unlink(temp.imagePath);
                } catch (error) {
                    console.warn("Error deleting image file:", error);
                }
            }

            return sendSuccessResponse(res, "OK", { data: createRecord });
        } catch (error) {
            console.error("Error creating receipt:", error);
            return sendErrorResponse(res, "INTERNAL_SERVER_ERROR");
        }
    }

    public static async updateRecord(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            const { recordId, store, date, total, change, method, items, categoryId } = req.body;

            if (!recordId || !store || !date || !total || !change || !items) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            const existingRecord = await prismaClient.record.findUnique({
                where: {
                    id: recordId,
                },
                include: {
                    items: true,
                },
            });
            if (!existingRecord || existingRecord.userId !== userId) {
                return sendErrorResponse(res, "NOT_FOUND");
            }

            const update = await prismaClient.$transaction(async (tx) => {
                await tx.item.deleteMany({
                    where: {
                        recordId: recordId,
                    },
                });

                const updatedRecord = await tx.record.update({
                    where: {
                        id: recordId,
                    },
                    data: {
                        store: store,
                        date: new Date(date),
                        total: total,
                        change: change ?? undefined,
                        method: method ?? undefined,
                        categoryId: categoryId ?? undefined,
                        items: {
                            create: items.map((item: any) => ({
                                name: item.name,
                                price: item.price,
                            })),
                        },
                    },
                    include: {
                        items: true,
                    },
                });
                return updatedRecord;
            });

            return sendSuccessResponse(res, "OK", { data: update });
        } catch (error) {
            console.error("Error updating record:", error);
            return sendErrorResponse(res, "INTERNAL_SERVER_ERROR");
        }
    }

    public static async getMonthlyRecords(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            const year = Number(req.query.year);
            const month = Number(req.query.month);
            if (!year || !month || month < 1 || month > 12) {
                return sendErrorResponse(res, "MISSING_PARAMETERS");
            }

            const from = startOfMonth(new Date(year, month - 1));
            const to = endOfMonth(from);

            const records = await prismaClient.record.findMany({
                where: {
                    userId: userId,
                    date: {
                        gte: from,
                        lte: to,
                    },
                },
                include: {
                    items: true,
                },
                orderBy: {
                    date: "asc",
                },
            });

            return sendSuccessResponse(res, "OK", { data: records });
        } catch (error) {
            console.error("Error fetching monthly records:", error);
            return sendErrorResponse(res, "INTERNAL_SERVER_ERROR");
        }
    }
}

export default recordService;
