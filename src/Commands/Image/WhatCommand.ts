import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "what",
    description: "Generate 'what' image",
    usage: "what [user|image|^]",
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
export default class WhatCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const parse = this.client.utils.parseMsg(ctx, ctx.options?.getString("image") ?? undefined);
        const img = await this.client.apis.canvas.requestImageAPI("what", { url: parse });
        const ath = new MessageAttachment(img!, "what.png");
        const e = createEmbed("info")
            .setImage("attachment://what.png")
            .setTimestamp()
            .setFooter({ text: `Commanded by ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL({ dynamic: true, size: 4096 })! });
        await ctx.send({ embeds: [e], files: [ath], deleteButton: { reference: ctx.author.id } });
    }
}
