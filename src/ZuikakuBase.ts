import "module-alias/register";
import process from "node:process";
import { ZuikakuClient } from "./Structures/ZuikakuClient";
import { Utils } from "./Utils";

const client = new ZuikakuClient(Utils.parseYaml("ZuikakuConfig.yaml"));
client.start();

process.on("unhandledRejection", e => {
    client.logger.error("unhandled rejection", "Unhandled Rejection:", e);
});

process.on("uncaughtException", error => {
    const errorMessage =
        error.stack?.replace(new RegExp(`${__dirname}/`, "g"), "./") ??
        error.message;
    client.logger.error(
        "uncaught exception",
        "Uncaught Exception:",
        errorMessage
    );
    client.logger.warn(
        "uncaught exception",
        "Fatal error has been detected. Exiting processing..."
    );
    process.exit(1);
});
