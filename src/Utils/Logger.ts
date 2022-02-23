import { blueBright, bold, greenBright, redBright, whiteBright, yellowBright } from "colorette";
import dayjs from "dayjs";

export class Logger {
    public log(value: { message?: string; module?: string }): void {
        if (!value.module) value.module = "";
        if (!value.message) value.message = "";
        console.log(`${this.getTimestamp()} - ${whiteBright(bold(`[${value.module}]`))} ${value.message}`);
    }

    public info(value: { message?: string; module?: string }): void {
        if (!value.module) value.module = "";
        if (!value.message) value.message = "";
        console.log(`${this.getTimestamp()} - ${blueBright(bold(`[${value.module}]`))} ${value.message}`);
    }

    public warn(value: { warn?: any; message?: string; module?: string }): void {
        if (!value.module) value.module = "";
        if (!value.message) value.message = "";
        if (!value.warn) value.warn = "";
        console.log(`${this.getTimestamp()} - ${yellowBright(bold(`[${value.module}]`))} ${value.message}`, value.warn);
    }

    public ready(value: { message?: string; module?: string }): void {
        if (!value.module) value.module = "";
        if (!value.message) value.message = "";
        console.log(`${this.getTimestamp()} - ${greenBright(bold(`[${value.module}]`))} ${value.message}`);
    }

    public error(value: { error?: any; message?: string; module?: string }): void {
        if (!value.module) value.module = "";
        if (!value.message) value.message = "";
        if (!value.error) value.error = "";
        console.log(`${this.getTimestamp()} - ${redBright(bold(`[${value.module}]`))} ${value.message}`, value.error);
    }

    private getTimestamp(): string {
        return dayjs(new Date()).format("DD-MM-YY-hh-mm-ss");
    }
}
