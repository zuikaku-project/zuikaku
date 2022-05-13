import "module-alias/register";
import process from "node:process";
import { ZuikakuClient } from "./Structures/ZuikakuClient";
import { Utils } from "./Utils";

const client = new ZuikakuClient(Utils.parseYaml("config.yaml"));
client.start();

process.on("unhandledRejection", e => {
    client.logger.error("unhandled rejection", "Unhandled Rejection:", e);
});

process.on("uncaughtException", error => {
    client.logger.error(
        "uncaught exception",
        "Uncaught Exception:",
        error.stack ?? error.message
    );
    client.logger.warn(
        "uncaught exception",
        "Fatal error has been detected. Exiting processing..."
    );
    process.exit(1);
});
