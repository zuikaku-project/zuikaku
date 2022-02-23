/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { GuildMember, MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "bully",
    description: "Bully someone",
    usage: "bully <user>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "member",
                type: "USER",
                description: "User you want to bully",
                required: true
            }
        ]
    }
})
export default class BullyCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = ctx.options?.getMember("member") as GuildMember;
        const { url } = await petitio("https://api.waifu.pics/sfw/bully")
            .header({
                "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                Accept: "application/json"
            }).json();
        const parseExt = url.split(".")[url.split(".").length - 1];
        const ath = new MessageAttachment(url as string, `bully.${parseExt as string}`);
        const e = createEmbed("info")
            .setImage(`attachment://bully.${parseExt as string}`)
            .setTimestamp()
            .setFooter({ text: `Commanded by ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL({ dynamic: true, size: 4096 })! })
            .setTitle(`${member.user.username} Bullied by ${ctx.author.username}`);
        await ctx.send({ embeds: [e], files: [ath] });
    }
}
