/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { GuildMember, MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "bite",
    description: "Bite Someone",
    usage: "{CATEGORY} bite {ABRACKETSL}user{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "member",
                type: "USER",
                description: "User you want to bite",
                required: true
            }
        ]
    }
})
export default class BiteCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = ctx.options?.getMember("member") as GuildMember;
        const { url } = await this.client.apis.weebs.weeby.gif("bite");
        const parseExt = url.split(".")[url.split(".").length - 1];
        const ath = new MessageAttachment(
            url as string,
            `bite.${parseExt as string}`
        );
        const e = createEmbed("info")
            .setImage(`attachment://bite.${parseExt as string}`)
            .setTimestamp()
            .setFooter({
                text: `Commanded by ${ctx.author.tag}`,
                iconURL: ctx.author.displayAvatarURL({
                    dynamic: true,
                    size: 4096
                })!
            })
            .setTitle(
                `${member.user.username} Bitted by ${ctx.author.username}`
            );
        await ctx.send({ files: [ath], embeds: [e] }, "editReply");
    }
}
