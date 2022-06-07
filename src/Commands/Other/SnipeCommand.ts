import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { MessageEmbed, TextChannel, ThreadChannel } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "snipe",
    description: "Get last message deleted",
    usage: "snipe [channel]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "channel",
                type: "CHANNEL",
                description: "Snipe channel"
            }
        ]
    }
})
export default class SnipeCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const channel = ctx.options?.getChannel("channel") ?? ctx.channel;
        if (
            channel instanceof TextChannel ||
            channel instanceof ThreadChannel
        ) {
            const snipes = this.client.snipe.get(channel.id);
            if (snipes) {
                const embeds = this.generateEmbedPage(snipes, channel);
                await new this.client.utils.pagination(
                    ctx,
                    embeds
                ).Pagination();
            } else {
                await ctx
                    .send({
                        embeds: [
                            createEmbed(
                                "error",
                                `**I can't get last message delete in channel \`${channel.name}\`**`
                            )
                        ]
                    })
                    .then(x =>
                        setTimeout(() => x.delete().catch(() => null), 5000)
                    )
                    .catch(() => null);
            }
        } else {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "info",
                            "**Please input the valid Text Channel**"
                        )
                    ]
                })
                .then(x => setTimeout(() => x.delete().catch(() => null), 5000))
                .catch(() => null);
        }
    }

    private generateEmbedPage(
        snipes: MessageEmbed[][],
        channel: TextChannel | ThreadChannel
    ): MessageEmbed[][] {
        let i = 1;
        return snipes.map(embed => {
            embed[0].setFooter({
                text: `Page [${i++}/${snipes.length}] • #${channel.name}`,
                iconURL: this.client.user?.displayAvatarURL({ format: "png" })
            });
            return embed;
        });
    }
}
