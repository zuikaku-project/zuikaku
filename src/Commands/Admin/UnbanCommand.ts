/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions */
import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "unban",
    description: "Unban user from the guild",
    usage: "{CATEGORY} unban {ABRACKETSL}user{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "BAN_MEMBERS"],
    userPermissions: ["BAN_MEMBERS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "user",
                type: "STRING",
                description: "User who want to unbanned",
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
export default class UnbanCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const user = await this.client.users
            .fetch(Utils.getUserId(ctx.options!.getString("user")!))
            .catch(() => null);
        if (!user) {
            ctx.send({
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
        const tag = user.tag;
        const id = user.id;
        const databan = await ctx.guild?.bans.fetch().catch(() => null);
        if (databan?.get(id) === undefined) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            "**<a:decline:879311910045097984> | This user was not banned from this guild**"
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
            await ctx.guild?.members.unban(
                id,
                ctx.options?.getString("reason") ?? ""
            );
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "success",
                            `**<a:accept:884700222951931964> | Operation to unban **\`${tag}\`** successful!**`
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        } catch (e: any) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "error",
                            `**Sorry i couldn't unban this user because \`\`\`js\n${e.message}\n\`\`\`**`
                        )
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
    }
}
