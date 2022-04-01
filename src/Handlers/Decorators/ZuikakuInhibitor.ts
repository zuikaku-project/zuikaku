/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable func-names, @typescript-eslint/naming-convention */
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { createMusicEmbed } from "@zuikaku/Utils/GenerateEmbed";

// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export function ZuikakuInhibitor<T extends (ctx: CommandContext, ...args: any[]) => Promise<string | void> | (string | void)>(func: T) {
    return function (_target: unknown, _memberName: string, descriptor: PropertyDescriptor): void {
        const method = descriptor.value;
        if (!method) throw new Error("Descriptor value isn't provided");
        descriptor.value = async function (ctx: CommandContext, ...args: any[]): Promise<any> {
            const message = await func(ctx, ...args);
            const getGuildDatabase = await ctx.client.database.entity.guilds.get(ctx.guild!.id);
            if (typeof message === "string") {
                if (message.length) {
                    if (ctx.isInteraction() && !ctx.deferred) {
                        await ctx.deferReply(ctx.channel?.id === getGuildDatabase?.guildPlayer?.channelId);
                    }
                    const msg = await ctx.send({
                        embeds: [
                            createMusicEmbed(ctx, "info", message)
                        ]
                    });
                    if (ctx.channel?.id === getGuildDatabase?.guildPlayer?.channelId) {
                        setTimeout(() => msg.delete().catch(() => null), 5000);
                    }
                    return;
                }
            }
            await method.call(this, ctx, ...args);
        };
    };
}
