import { Dispatcher } from "@zuikaku/Handlers";
import { isMusicPlaying, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageEmbed } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "queue",
    description: "Display all track from player",
    usage: "{CATEGORY} queue",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class QueueCommand extends ZuikakuCommand {
    @isMusicPlaying()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.entity.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(fromGuildPlayer);
        const embeds = this.embedGen(this.client.shoukaku.dispatcher.get(ctx.guild!.id)!);
        await new this.client.utils.pagination(ctx, embeds).Pagination();
    }

    private embedGen(dispatcher: Dispatcher): MessageEmbed[] {
        const queue = dispatcher.queue.tracks;
        const embeds = []; const infoArray = [];
        // eslint-disable-next-line no-eval
        const estimate = this.client.utils.parseMs(eval(queue.map(x => x.info.length! / 1000).filter(x => Boolean(x)).join("+")!) * 1000, { colonNotation: true }).colonNotation;
        let k = 10;
        for (let i = 0; i < (queue.length === 0 ? 1 : queue.length)!; i += 10) {
            const current = queue.slice(i, k);
            let j = i;
            k += 10;
            infoArray.push(current.map(x => `**${++j} • [${x.info.title!}](${x.info.uri!})**`).join("\n"));
        }
        for (const info of infoArray.values()) {
            const embed = createEmbed("info").setThumbnail(dispatcher._timeout ? this.client.user!.displayAvatarURL({ format: "png", size: 4096 }) : dispatcher.queue.current!.thumbnail!);
            if (queue.length !== 0) {
                embed.setFooter({ text: `Total ${queue.length} Tracks ${queue.map(track => track.info.isStream).includes(true) ? "" : `in  ${estimate}`}` });
            }
            if (queue.length === 0 && dispatcher._timeout) {
                embed.setDescription("**404: Not Found**");
            } else if (queue.length === 0) {
                embed.setDescription(
                    `**[${dispatcher.queue.current!.info.title!}](${dispatcher.queue.current!.info.uri!}) \`【${dispatcher.queue.current!.requester!.username}】\`**\n\n` +
                    "**▬▬▬▬▬▬▬▬ List of Queue ▬▬▬▬▬▬▬▬**\n" +
                    "**404: Not Found**"
                );
            } else {
                embed.setDescription(
                    `**[${dispatcher.queue.current!.info.title!}](${dispatcher.queue.current!.info.uri!}) \`【${dispatcher.queue.current!.requester!.username}】\`**\n\n` +
                    "**▬▬▬▬▬▬▬▬ List of Queue ▬▬▬▬▬▬▬▬**\n" +
                    `${info}`
                );
            }
            embeds.push(embed);
        }
        return embeds;
    }
}
