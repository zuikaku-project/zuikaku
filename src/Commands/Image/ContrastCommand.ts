import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "contrast",
    description: "Apply the contrast filter to image",
    usage: "{CATEGORY} contrast [image]",
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
export default class ContrastCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const parse = Utils.parseMsg(
            ctx,
            ctx.options?.getString("image") ?? undefined
        );
        const bufferData = await this.client.apis.canvas.requestImageAPI(
            "contrast",
            { url: parse }
        );
        const ath = new MessageAttachment(bufferData!, "contrast.png");
        const e = createEmbed("info")
            .setImage("attachment://contrast.png")
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
