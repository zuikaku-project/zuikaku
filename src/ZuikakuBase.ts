import "module-alias/register";
import express from "express";
import process from "node:process";
import { ZuikakuClient } from "./Structures/ZuikakuClient";
import cors from "cors";
import { Utils } from "./Utils";
import { join } from "node:path";

const client = new ZuikakuClient();
client.start();

const app = express();
app.set("trust proxy", 1);
app.set("json spaces", 2);
app.use(cors({ origin: "*" }));
app.get("/", (_, res) => res.status(200).send({ status: "ok" }));
app.get("/commands", (_, res) =>
    res.status(200).send(
        client.commands
            .filter(x => Boolean(x.meta.slash))
            .map(x => ({
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
    )
);
app.get("/changelogs", (_, res) => {
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];
    const changelog = Utils.parseYaml<IChangelog[]>(join("./Changelog.yaml"));
    res.status(200).send(
        changelog.reverse().map(x => ({
            date: {
                day: new Date(x.date).getDate(),
                month: months[new Date(x.date).getMonth()],
                year: `${new Date(x.date).getFullYear()}`.slice(2)
            },
            title: x.title,
            content: x.content.map((z, i) => `${i + 1}. ${z}`)
        }))
    );
});
app.get("/avatar", async (_, res) => {
    const myAvatar = client.user?.displayAvatarURL({
        format: "png",
        size: 4096
    });
    const ownerAvatar = (
        client.users.cache.get(client.options.ownerId[0]) ??
        (await client.users.fetch(client.options.ownerId[0]))
    ).displayAvatarURL({ format: "png", size: 4096 });
    res.status(200).send({
        myAvatar,
        ownerAvatar
    });
});
app.listen(process.env.SERVER_PORT ?? 3002, () => {
    client.logger.info(
        "express",
        `Server is running on port ${process.env.SERVER_PORT ?? 3002}`
    );
});

process.on("unhandledRejection", e => {
    client.logger.error("unhandled rejection", "Unhandled Rejection: ", e);
});

process.on("uncaughtException", error => {
    const errorMessage =
        error.stack?.replace(new RegExp(`${__dirname}/`, "g"), "./") ??
        error.message;
    client.logger.error(
        "uncaught exception",
        "Uncaught Exception: ",
        errorMessage
    );
    client.logger.warn(
        "uncaught exception",
        "Fatal error has been detected. Exiting processing..."
    );
    process.exit(1);
});

interface IChangelog {
    date: Date;
    title: string;
    content: string[];
}
