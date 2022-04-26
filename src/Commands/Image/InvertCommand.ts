import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "invert",
    description: "Apply the invert filter to image",
    usage: "{CATEGORY} invert [image]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "image",
                type: "STRING",
                description: "User, Emoji, or Image"
            }
        ]
    }
})
export default class InvertCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const parse = Utils.parseMsg(
            ctx,
            ctx.options?.getString("image") ?? undefined
        );
        const bufferData = await this.client.apis.canvas.requestImageAPI(
            "invert",
            {
                url: parse
            }
        );
        const ath = new MessageAttachment(bufferData!, "invert.png");
        const e = createEmbed("info")
            .setImage("attachment://invert.png")
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
