import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent, ISpotifyLyrics } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageEmbed } from "discord.js";

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
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const spotify = ctx.member?.presence?.activities.filter(x => x.name === "Spotify")[0];
        const lyrics = ctx.options?.getString("title");
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id);
        let title;
        if (lyrics) {
            title = lyrics;
        } else if (ctx.member!.voice.channelId === queue?.voiceId) {
            title = `${queue.current!.info.title!} ${queue.current!.info.author!}`;
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'lyrics' does not exist on type '{}'.
        const fetch = await this.client.shoukaku.getNode().rest.router.lyrics({ title }).get().catch(() => null) as ISpotifyLyrics | null; // eslint-disable-line
        if (
            !fetch ||
            !fetch.lyrics ||
            !fetch.lyrics.length ||
            !fetch.trackUrl
        ) {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**Sorry i can't get song lyrics match that title**")
                ]
            });
            return undefined;
        }
        if (fetch.trackName) fetch.trackName = title;
        if (fetch.trackArtist) fetch.trackArtist = "UNKNOWN_ARTIST";
        const splitdata = this.splitString(fetch, ctx);
        await new this.client.utils.pagination(ctx, splitdata).shortPagination();
    }

    private splitString(b: ISpotifyLyrics, ctx: CommandContext): MessageEmbed[] {
        const em = []; const array = []; const array2 = [];
        let k = 0;
        const title = b.trackName!;
        const artists = b.trackArtist!;
        const url = b.trackUrl!;
        const image = b.imageUrl;
        const lyrics = b.lyrics!;
        for (const lyricses of lyrics) {
            array.push(lyricses);
        }
        for (let a = 0; a < array.length; a += 40) {
            k += 40;
            array2.push(array.slice(a, k));
        }
        for (let x = 0; x < array2.length; x++) {
            const ly = array2[x].join("\n");
            const e = createEmbed("info")
                .setAuthor({
                    name: `🎶 | ${artists} - ${title}`,
                    iconURL: this.client.user!.displayAvatarURL({ format: "png", size: 4096 })!,
                    url
                })
                .setDescription(ly)
                .setThumbnail(image ?? "")
                .setTimestamp()
                .setFooter({
                    text: `Page (${x + 1}/${array2.length})`,
                    iconURL: ctx.author.displayAvatarURL({ dynamic: true, format: "png", size: 4096 })!
                });
            em.push(e);
        }
        return em;
    }
}
