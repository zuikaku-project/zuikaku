import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageEmbed, TextChannel, ThreadChannel, User } from "discord.js";

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
        if (channel instanceof TextChannel || channel instanceof ThreadChannel) {
            const snipes = this.client.snipe.get(channel.id) as Snipe[] | undefined;
            if (snipes) {
                const embeds = this.geneembed(snipes, channel);
                await new this.client.utils.pagination(ctx, embeds).Pagination();
            } else {
                await ctx.send({ embeds: [createEmbed("error", `**I can't get last message delete in channel \`${channel.name}\`**`)] }).then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
            }
        } else {
            await ctx.send({ embeds: [createEmbed("info", "**Please input the valid Text Channel**")] }).then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
        }
    }

    private geneembed(snipes: Snipe[], channel: TextChannel | ThreadChannel): MessageEmbed[] {
        const array = snipes.map(({ content, author, date, attachments }) => {
            content = content.length <= 2047 ? content : `${content.substring(0, 2047).trim()} ...`;
            const generateEmbed = createEmbed("info", content)
                .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL({ dynamic: true }) })
                .addField("Date", `<t:${date}:F> (<t:${date}:R>)`);
            if (attachments.length) {
                generateEmbed.addField("Attachments", attachments.join("\n"));
            }
            return generateEmbed;
        });
        let i = 1;
        array.map(embed => embed.setFooter({ text: `Page [${i++}/${snipes.length}] • #${channel.name}`, iconURL: this.client.user?.displayAvatarURL({ format: "png" }) }));
        return array;
    }
}

interface Snipe {
    author: User;
    content: string;
    date: string;
    attachments: string[];
}
