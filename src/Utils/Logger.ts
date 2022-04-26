import {
    blueBright,
    bold,
    redBright,
    whiteBright,
    yellowBright
} from "colorette";
import dayjs from "dayjs";

export class Logger {
    public debug(...messages: any[]): void {
        this.log(messages, "debug");
    }

    public error(...messages: any[]): void {
        this.log(messages, "error");
    }

    public info(...messages: any[]): void {
        this.log(messages, "info");
    }

    public warn(...messages: any[]): void {
        this.log(messages, "warn");
    }

    private get timestamp(): string {
        return dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
    }

    private log(
        messages: any[],
        type: "debug" | "error" | "info" | "warn" = "info"
    ): void {
        const color = (
            (type === "debug" ? whiteBright : type === "error")
                ? redBright
                : type === "warn"
        )
            ? yellowBright
            : blueBright;
        console[type](
            color(
                `${bold(
                    `[${this.timestamp}] - [${
                        (messages[0] as string | undefined)
                            ?.toUpperCase()
                            .split(" ")
                            .join("_") ?? type
                    }]: ${messages
                        .slice(1)
                        .map(x => String(x))
                        .join(" ")}`
                )}`
            )
        );
    }
}
