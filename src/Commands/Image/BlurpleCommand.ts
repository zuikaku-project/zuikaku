import {
    isValidAttachment,
    ZuikakuDecorator
} from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";
import { MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "blurple",
    description: "Apply the blurple filter to image",
    usage: "{CATEGORY} blurple [image]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "image",
                type: "STRING",
                description: "User, Emoji, or Image"
            },
            {
                name: "file",
                type: "ATTACHMENT",
                description: "Image file"
            }
        ]
    }
})
export default class BlurpleCommand extends ZuikakuCommand {
    @isValidAttachment("file", "image")
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const parse = Utils.parseMsg(
            ctx,
            ctx.options?.getString("image") ??
                ctx.options?.getAttachment("file")?.url ??
                undefined
        );
        const { url } = await petitio(
            `https://neko-love.xyz/api/v2/blurple?url=${parse}`
        )
            .header({
                "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                Accept: "application/json"
            })
            .json();
        const ath = new MessageAttachment(url as string, "blurple.png");
        const e = createEmbed("info")
            .setImage("attachment://blurple.png")
            .setTimestamp()
            .setFooter({
                text: `Commanded by ${ctx.author.tag}`,
                iconURL: ctx.author.displayAvatarURL({
                    dynamic: true,
                    size: 4096
                })!
            });
        await ctx.send({
            embeds: [e],
            files: [ath],
            deleteButton: { reference: ctx.author.id }
        });
    }
}
