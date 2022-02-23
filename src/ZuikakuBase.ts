import "module-alias/register";
import process from "node:process";
import { ZuikakuClient } from "./Structures/ZuikakuClient";
process.on("unhandledRejection", e => {
    console.log("Error handler caught an error:", e);
});

process.on("uncaughtException", e => {
    console.log("Error handler caught an error:", e);
    console.info("Fatal error has been detected. Exiting processing...");
    process.exit(1);
});
new ZuikakuClient().start();
