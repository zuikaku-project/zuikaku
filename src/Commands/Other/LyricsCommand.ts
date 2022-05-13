import {
    ZuikakuDecorator,
    isNoNodesAvailable
} from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "lyrics",
    description: "Get lyrics from musixmatch. Support spotify presence",
    usage: "lyrics [title]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "title",
                type: "STRING",
                description: "Title of the song"
            }
        ]
    }
})
export default class LyricsCommand extends ZuikakuCommand {
    @isNoNodesAvailable(true)
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const spotify = ctx.member.presence?.activities.filter(
            x => x.name === "Spotify"
        )[0];
        const lyrics = ctx.options?.getString("title");
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id);
        let title;
        if (lyrics) {
            title = lyrics;
        } else if (ctx.member.voice.channelId === dispatcher?.voiceId) {
            title = `${dispatcher.queue.current!.info.title!} ${dispatcher.queue
                .current!.info.author!}`;
        } else if (spotify) {
            title = `${spotify.state!} ${spotify.details!}`;
        } else {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**You need to input song title**")
                ]
            });
            return undefined;
        }
        const fetch = await this.client.shoukaku.getLyrics(title);
        if (!fetch.lyrics || !fetch.lyrics.length) {
            await ctx.send({
                embeds: [
                    createEmbed(
                        "info",
                        "**Sorry i can't get song lyrics match that title**"
                    )
                ]
            });
            return undefined;
        }
        const trackName = fetch.trackName ?? title;
        const tractArtist = fetch.trackArtist ?? "UNKNOWN_ARTIST";
        const trackUrl = fetch.trackUrl ?? "";
        const imageUrl = fetch.imageUrl ?? "";
        const lyricses = fetch.lyrics;
        const generateChunks = Utils.chunk(lyricses, 30);
        const generateEmbeds = generateChunks.map(x =>
            createEmbed("info")
                .setAuthor({
                    name: `🎶 | ${tractArtist} - ${trackName}`,
                    url: trackUrl,
                    iconURL: this.client.user!.displayAvatarURL({
                        format: "png",
                        size: 4096
                    })!
                })
                .setDescription(x.join("\n"))
                .setThumbnail(imageUrl)
                .setTimestamp()
                .setFooter({
                    text: `Page (${generateChunks.indexOf(x) + 1}/${
                        generateChunks.length
                    })`,
                    iconURL: ctx.author.displayAvatarURL({
                        dynamic: true,
                        format: "png",
                        size: 4096
                    })!
                })
        );
        await new this.client.utils.pagination(
            ctx,
            generateEmbeds
        ).shortPagination();
    }
}
