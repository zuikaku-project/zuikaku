/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "kick",
    description: "Kick user from the guild",
    usage: "{CATEGORY} kick {ABRACKETSL}user{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "KICK_MEMBERS"],
    userPermissions: ["KICK_MEMBERS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "user",
                type: "USER",
                description: "User who want to kick",
                required: true
            },
            {
                name: "reason",
                type: "STRING",
                description: "Admin Reason"
            }
        ]
    }
})
export default class KickCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = ctx.guild?.members.cache.get(
            ctx.options!.getUser("user")!.id
        );
        if (!member) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            "**<a:decline:879311910045097984> | Invalid User**"
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
        if (!member.kickable) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            "**<a:decline:879311910045097984> | I can't kick this user**"
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
        if (member.user.id === ctx.author.id) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            "**<a:decline:879311910045097984> | You can't kick yourself**"
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
        if (member.user.id === this.client.user?.id) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            "**<a:decline:879311910045097984> | I can't kick myself**"
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
        try {
            await member.kick(ctx.options?.getString("reason") ?? "");
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "success",
                            `**<a:accept:884700222951931964> | Operation to kick \`${member.user.tag}\` successful!**`
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
        } catch (e: any) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            `**Sorry i couldn't kick this user because \`\`\`js\n${e.message}\n\`\`\`**`
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
        }
    }
}
