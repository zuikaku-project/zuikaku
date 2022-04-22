import { isMusicPlaying, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "nowplaying",
    description: "Display the current playing",
    usage: "{CATEGORY} nowplaying",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class NowplayingCommand extends ZuikakuCommand {
    @isMusicPlaying()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.entity.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(fromGuildPlayer);
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        const timesCurrentDuration = dispatcher.queue.current!.info.length!;
        const math = (timesCurrentDuration - (timesCurrentDuration - dispatcher.player.position)) / 1000;
        const final = this.client.utils.progressBar(
            dispatcher.queue.current?.info.isStream ? 1 : dispatcher.queue.current!.info.length! / 1000, dispatcher.queue.current?.info.isStream ? 1 : math, 15
        );
        const progress = Math.abs(timesCurrentDuration - dispatcher.player.position - timesCurrentDuration);
        const time = dispatcher.queue.current?.info.isStream
            ? "◉ LIVE"
            : `${this.client.utils.parseMs(progress, { colonNotation: true }).colonNotation}/${dispatcher.queue.current!.durationFormated!}`;
        const duration = createEmbed("info")
            .setAuthor({
                name: dispatcher.queue.current!.info.title!,
                iconURL: this.client.user!.displayAvatarURL({ format: "png" }),
                url: dispatcher.queue.current?.info.uri
            })
            .setDescription(
                `${dispatcher.player.paused ? "⏸️" : "▶️"} **${final} \`[${time}]\`\n` +
                `Requested by \`【${dispatcher.queue.current!.requester!.username}】\`**`
            )
            .setImage(dispatcher.queue.current!.thumbnail!);
        const generateLastNowplayingMessage = await ctx.send({
            embeds: [duration],
            deleteButton: {
                reference: ctx.author.id
            }
        }).catch(() => null);
        dispatcher.queueMessage.lastNowplayingMessage = generateLastNowplayingMessage ?? null;
    }
}
