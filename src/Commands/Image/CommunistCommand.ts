import {
    isValidAttachment,
    ZuikakuDecorator
} from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "communist",
    description: "Apply the communist filter to image",
    usage: "{CATEGORY} communist [image]",
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
export default class CommunistCommand extends ZuikakuCommand {
    @isValidAttachment("file", "image")
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const parse = Utils.parseMsg(
            ctx,
            ctx.options?.getString("image") ??
                ctx.options?.getAttachment("file")?.url ??
                undefined
        );
        const img = await this.client.apis.canvas.requestImageAPI("communist", {
            url: parse
        });
        const ath = new MessageAttachment(img!, "communist.png");
        const e = createEmbed("info")
            .setImage("attachment://communist.png")
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
