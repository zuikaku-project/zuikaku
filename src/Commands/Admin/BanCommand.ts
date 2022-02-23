/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "ban",
    description: "Ban user from the guild",
    usage: "ban <user[mention|id]>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
    userPermissions: ["BAN_MEMBERS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "user",
                type: "STRING",
                description: "User who want to ban",
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
export default class BanCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const getUser = await this.client.users.fetch(this.client.utils.getUserId(ctx.options!.getString("user")!)).catch(() => null);
        if (!getUser) {
            await ctx.send({
                embeds: [
                    createEmbed("error", "**<a:decline:879311910045097984> | Invalid User**")
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
            return undefined;
        }
        let tag; let id;
        const guildMember = ctx.guild?.members.cache.get(getUser.id);
        if (guildMember) {
            if (!guildMember.bannable) {
                await ctx.send({
                    embeds:
                        [
                            createEmbed("error", "**<a:decline:879311910045097984> | I can't ban this user**")
                        ]
                }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
                return undefined;
            }
            if (guildMember.user.id === ctx.author.id) {
                await ctx.send({
                    embeds: [
                        createEmbed("error", "**<a:decline:879311910045097984> | You can't ban yourself**")
                    ]
                }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
                return undefined;
            }
            if (guildMember.user.id === this.client.user?.id) {
                await ctx.send({
                    embeds: [
                        createEmbed("error", "**<a:decline:879311910045097984> | I can't ban myself**")
                    ]
                }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
                return undefined;
            }
            tag = guildMember.user.tag;
            id = guildMember.user.id;
        } else {
            tag = getUser.tag;
            id = getUser.id;
        }
        const databan = await ctx.guild?.bans.fetch().catch(() => null);
        if (!databan) {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**<a:decline:879311910045097984> | Sorry, I can't fetch guild band**")
                ]
            });
            return undefined;
        }
        if (databan.get(id) !== undefined) {
            await ctx.send({
                embeds: [
                    createEmbed("error", "**<a:decline:879311910045097984> | This user has been banned from this guild**")
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
            return undefined;
        }
        try {
            await ctx.guild?.bans.create(getUser, { reason: ctx.options?.getString("reason") ?? "" });
            await ctx.send({
                embeds: [
                    createEmbed("success", `**<a:accept:884700222951931964> | Operation to ban **\`${tag}\`** successful!**`)
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
        } catch (e: any) {
            await ctx.send({
                embeds: [
                    createEmbed("error", `**Sorry i couldn't ban this user because \`\`\`js\n${e.message}\n\`\`\`**`)
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
        }
    }
}
