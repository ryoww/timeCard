import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { prismaClient } from "./prisma";
import authRouter from "./routers/auth.router";
import loggingMiddleware from "./middlewares/logger.middleware";
import receiptRouter from "./routers/receipt.router";

if (!process.env.PORT) {
    throw new Error("PORT environment variable is not set");
}

const PORT = process.env.PORT;

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true,
    })
);

app.get("/", (req: Request, res: Response) => {
    res.send("online");
});

app.set("trust proxy", true);
app.use(loggingMiddleware());

app.use("/auth", authRouter);
app.use("/receipt", receiptRouter);
app.use("/record", receiptRouter);

const shutdown = () => {
    console.log("Shutting down server...");
    prismaClient
        .$disconnect()
        .then(() => {
            httpServer.close(() => {
                console.info("Server closed");
                process.exit(0);
            });
        })
        .catch((err: Error) => {
            console.error("Error during disconnection:", err);
            process.exit(1);
        });
};

process.once("SIGINT", shutdown);
process.once("SIGINT", shutdown);

httpServer.listen(PORT, () => {
    console.info(`http://localhost:${PORT}`);
});
