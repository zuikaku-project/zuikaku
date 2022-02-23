import { isMusicPlaying, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "nowplaying",
    description: "Display the current playing",
    usage: "nowplaying",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class NowplayingCommand extends ZuikakuCommand {
    @isMusicPlaying()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(fromGuildPlayer);
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        const timesCurrentDuration = queue.current!.info.length!;
        const math = (timesCurrentDuration - (timesCurrentDuration - queue.player.position)) / 1000;
        const final = this.client.utils.progressBar(queue.current?.info.isStream ? 1 : queue.current!.info.length! / 1000, queue.current?.info.isStream ? 1 : math, 15);
        const progress = Math.abs(timesCurrentDuration - queue.player.position - timesCurrentDuration);
        const time = queue.current?.info.isStream
            ? "◉ LIVE"
            : `${this.client.utils.parseMs(progress, { colonNotation: true }).colonNotation}/${queue.current!.durationFormated!}`;
        const duration = createEmbed("info")
            .setAuthor({ name: queue.current!.info.title!, iconURL: this.client.user!.displayAvatarURL({ format: "png" }), url: queue.current?.info.uri })
            .setDescription(
                `${queue.player.paused ? "⏸️" : "▶️"} **${final} \`[${time}]\`\n` +
                `Requested by \`【${queue.current!.requester!.username}】\`**`
            )
            .setImage(queue.current!.thumbnail!);
        const generateLastNowplayingMessage = await ctx.send({ embeds: [duration], deleteButton: { reference: ctx.author.id } }).catch(() => null);
        queue._lastNowplayingMessageId = generateLastNowplayingMessage?.id ?? null;
    }
}
