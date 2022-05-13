import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "racoon",
    description: "Random racoon picture",
    usage: "{CATEGORY} racoon",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class RacoonCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const { image } = await petitio(
            "https://some-random-api.ml/animal/racoon"
        )
            .header({
                "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                Accept: "application/json"
            })
            .json();
        const ath = new MessageAttachment(image as string, "racoon.png");
        const e = createEmbed("info")
            .setAuthor({
                name: `🐨| This is your racoon ${ctx.author.username}`
            })
            .setImage("attachment://racoon.png")
            .setFooter({
                text: `Commanded by ${ctx.author.tag}`,
                iconURL: ctx.author.displayAvatarURL({ dynamic: true })!
            })
            .setTimestamp();
        await ctx.send({ embeds: [e], files: [ath] });
    }
}
