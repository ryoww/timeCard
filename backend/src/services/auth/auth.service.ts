import { Request, Response } from "express";
import { prismaClient } from "../../prisma";
import { sendErrorResponse, sendSuccessResponse } from "../../lib/sendResponse";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

class authService {
    public static async register(req: Request, res: Response) {
        try {
            const { email, password, viewName } = req.body;

            const isExists = await prismaClient.user.findUnique({
                where: {
                    email,
                },
            });
            if (isExists) {
                return sendErrorResponse(res, "ALREADY_EXISTS");
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await prismaClient.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    viewName,
                },
            });


            return sendSuccessResponse(res, "CREATED", {
                data: { id: user.id },
            });
        } catch (error) {
            console.error("Error during registration:", error);
            return sendErrorResponse(res, "INTERNAL_SERVER_ERROR");
        }
    }

    public static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            const user = await prismaClient.user.findUnique({
                where: {
                    email,
                },
            });

            if (!user) {
                return sendErrorResponse(res, "INVALID_CREDENTIAL");
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );
            if (!isPasswordValid) {
                return sendErrorResponse(res, "INVALID_CREDENTIAL");
            }

            const token = jwt.sign(
                { userId: user.id, viewName: user.viewName, email: user.email },
                JWT_SECRET,
                {
                    expiresIn: "2d",
                }
            );

            console.log("token", token);

            return sendSuccessResponse(res, "OK", {
                data: { token: token },
            });
        } catch (error) {
            console.error("Error during login:", error);
            return sendErrorResponse(res, "INTERNAL_SERVER_ERROR");
        }
    }
}

export default authService;
