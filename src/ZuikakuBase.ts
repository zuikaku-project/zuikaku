import "module-alias/register";
import express from "express";
import process from "node:process";
import { ZuikakuClient } from "./Structures/ZuikakuClient";
import { readFileSync } from "node:fs";
import cors from "cors";

process.on("unhandledRejection", e => {
    console.log("Error handler caught an error:", e);
});

process.on("uncaughtException", e => {
    console.log("Error handler caught an error:", e);
    console.info("Fatal error has been detected. Exiting processing...");
    process.exit(1);
});

const client = new ZuikakuClient();
client.start();

const app = express();
app.set("trust proxy", 1);
app.set("json spaces", 2);
app.use(cors({ origin: "*" }));
app.get("/", (_, res) => res.status(200).send({ status: "ok" }));
app.get("/commands", (_, res) => res
    .status(200)
    .send(
        client.commands.filter(x => Boolean(x.meta.slash)).map(x => ({
            name: x.meta.name,
            category: x.meta.category,
            description: x.meta.description,
            path: x.meta.path,
            devOnly: x.meta.devOnly,
            usage: x.meta.usage,
            permissions: {
                user: x.meta.userPermissions,
                client: x.meta.clientPermissions
            },
            interactionOption: {
                contextChat: x.meta.contextChat,
                slash: x.meta.slash
            }
        }))
    ));
app.get("/changelog", (_, res) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    res
        .status(200)
        .send((JSON.parse(readFileSync("./Changelog.json", "utf8")) as IChangelog[]).reverse().map(x => ({
            date: {
                day: new Date(x.date).getDate(),
                month: months[new Date(x.date).getMonth()],
                year: `${new Date(x.date).getFullYear()}`.slice(2)
            },
            title: x.title,
            content: x.content.map((z, i) => `${i + 1}. ${z}`)
        })));
});
app.get("/avatars", async (_, res) => {
    const myAvatar = client.user?.displayAvatarURL({ format: "png", size: 4096 });
    const ownerAvatar = await client.users.fetch(client.options.ownerId[0]).then(x => x.displayAvatarURL({ format: "png", size: 4096 }));
    res
        .status(200)
        .send({
            myAvatar,
            ownerAvatar
        });
});
app.listen(process.env.SERVER_PORT ?? 3002, () => {
    console.log(`Server is running on port ${process.env.SERVER_PORT ?? 3002}`);
});

interface IChangelog {
    date: Date;
    title: string;
    content: string[];
}
