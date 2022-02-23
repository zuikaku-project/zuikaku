import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { GuildMember, MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "punch",
    description: "Punch someone",
    usage: "punch <user>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "member",
                type: "USER",
                description: "User you want to punch",
                required: true
            }
        ]
    }
})
export default class PunchCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = ctx.options?.getMember("member") as GuildMember;
        const { url } = await petitio("https://neko-love.xyz/api/v1/punch")
            .header({
                "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                Accept: "application/json"
            }).json();
        const ath = new MessageAttachment(url as string, "punch.gif");
        const e = createEmbed("info")
            .setTitle(`${member.user.username} Punched by ${ctx.author.username}`)
            .setImage("attachment://punch.gif")
            .setTimestamp()
            .setFooter({ text: `Commanded by ${ctx.author.tag}`, iconURL: ctx.author.displayAvatarURL({ dynamic: true, size: 4096 })! });
        await ctx.send({ embeds: [e], files: [ath] });
    }
}
