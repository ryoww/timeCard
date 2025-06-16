import chalk from "chalk";
import { Request, Response, NextFunction } from "express";
import { appendFile } from "fs";
import path from "path";

const LOG_SAVE_DIR = process.env.LOG_SAVE_DIR as string;

const getLogFilePath = () => {
    return path.join(
        LOG_SAVE_DIR,
        `log_${new Date()
            .toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
            .replace(/\//g, "")}.json`
    );
};

const loggingMiddleware =
    () => (req: Request, res: Response, next: NextFunction) => {
        const timestamp = new Date().toISOString();
        (req as any).startTime = Date.now();

        res.on("finish", () => {
            const logObject = {
                timestamp,
                ip: req.ip,
                userId: (req as any).userId || null,
                method: req.method,
                url: req.originalUrl,
                statusCode: res.statusCode,
                responseTime: `${Date.now() - (req as any).startTime}ms`,
            };

            const jsonLog = JSON.stringify(logObject) + "\n";

            const methodColor =
                {
                    GET: chalk.green,
                    POST: chalk.blue,
                    PUT: chalk.yellow,
                    DELETE: chalk.red,
                    PATCH: chalk.magenta,
                }[req.method] || chalk.white;

            console.log(
                `${chalk.gray(`[${timestamp}]`)} ${methodColor(
                    req.method
                )} ${chalk.bgWhite(res.statusCode)} ${chalk.cyan(
                    req.originalUrl
                )}`
            );

            appendFile(getLogFilePath(), jsonLog, (err) => {
                if (err) {
                    console.error("ログ書き込みエラー", err);
                }
            });
        });

        next();
    };

export default loggingMiddleware;
