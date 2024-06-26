import {
    isNoNodesAvailable,
    isQueueReachLimit,
    isSameTextChannel,
    isSameVoiceChannel,
    isUserInTheVoiceChannel,
    isValidVoiceChannel,
    ZuikakuDecorator
} from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed, createMusicEmbed, Utils } from "#zuikaku/Utils";
import { Util } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "load",
    description: "Load the playlist and play-it",
    usage: "{CATEGORY} load {ABRACKETSL}id{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "playlist",
                description: "Id or name of the playlist",
                type: "STRING",
                required: true,
                autocomplete: true
            }
        ]
    }
})
export default class ViewPlaylistCommand extends ZuikakuCommand {
    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    @isQueueReachLimit()
    @isNoNodesAvailable()
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const getGuildDatabase = await this.client.database.manager.guilds.get(
            ctx.guild!.id
        );
        const fromGuildPlayer =
            getGuildDatabase?.guildPlayer.channelId === ctx.channel?.id;
        if (
            getGuildDatabase?.guildPlayer.channelId &&
            getGuildDatabase.guildPlayer.channelId !== ctx.channel?.id
        ) {
            await ctx
                .send({
                    embeds: [
                        createEmbed(
                            "info",
                            `**<a:decline:879311910045097984> | Operation Canceled. This command is restrictred to ${
                                this.client.channels
                                    .resolve(
                                        getGuildDatabase.guildPlayer.channelId
                                    )
                                    ?.toString() ?? "unknown"
                            } ** `
                        )
                    ]
                })
                .catch(() => null);
            return undefined;
        }
        const getUserDatabase = await this.client.database.manager.users.get(
            ctx.author.id
        );
        if (!getUserDatabase) {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "I am sorry, but you don't have any playlist database"
                        )
                    ]
                })
                .catch(() => null);
            return undefined;
        }
        const getUserPlaylist = getUserDatabase.playlists.find(
            ({ id }) => id === ctx.options!.getString("playlist")!
        );
        if (!getUserPlaylist) {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "I am sorry, but you don't have any playlist matches that id"
                        )
                    ]
                })
                .catch(() => null);
            return undefined;
        }
        if (getUserPlaylist.tracks.length) {
            const guildQueue = await this.client.shoukaku.handleJoin({
                guildId: ctx.guild!.id,
                channelId: ctx.member.voice.channel!.id,
                shardId: ctx.guild!.shard.id,
                textId: ctx.channel!.id,
                voiceId: ctx.member.voice.channel!.id
            });
            const buildUnresolved = getUserPlaylist.tracks.map(
                playlistTrack => {
                    const isrc = playlistTrack.ISRC ?? "";
                    const identifier = playlistTrack.id;
                    const author = playlistTrack.author;
                    const title = playlistTrack.title;
                    const uri = playlistTrack.url;
                    const length = playlistTrack.length;
                    const artworkUrl = playlistTrack.artwork ?? "";
                    const sourceName = playlistTrack.source;
                    return this.client.shoukaku.plugin.buildUnresolved({
                        isrc,
                        identifier,
                        author,
                        title,
                        uri,
                        length,
                        artworkUrl,
                        sourceName
                    });
                }
            );
            const buildResponse = this.client.shoukaku.plugin.buildResponse(
                "PLAYLIST_LOADED",
                buildUnresolved,
                {
                    name: getUserPlaylist.name,
                    selectedTrack: -1
                }
            );
            await guildQueue.queue.addTrack(
                buildResponse.tracks.map(track => {
                    track.setRequester(ctx.author);
                    track.setShoukaku(this.client.shoukaku);
                    return track;
                })
            );
            if (fromGuildPlayer)
                await this.client.shoukaku.embedPlayers
                    .get(ctx.guild!.id)
                    ?.update();
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `I enqueued ${
                                buildResponse.tracks.length
                            } track(s) from ${Util.escapeMarkdown(
                                getUserPlaylist.name
                            )} (${
                                Utils.parseMs(
                                    Number(
                                        // eslint-disable-next-line no-eval
                                        eval(
                                            buildResponse.tracks
                                                .map(({ info }) => info.length)
                                                .join("+")
                                        )
                                    ),
                                    { colonNotation: true }
                                ).colonNotation
                            })`
                        )
                    ]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            if (guildQueue._timeout || !guildQueue.player.track)
                await guildQueue.playTrack();
        } else {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `I am sorry, but your playlist ${getUserPlaylist.name}(${getUserPlaylist.id}) don't have any tracks`
                        )
                    ]
                })
                .catch(() => null);
        }
    }
}
