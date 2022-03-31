import { isNoNodesAvailable, isQueueReachLimit, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, isValidVoiceChannel, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent, PlaylistTrack } from "@zuikaku/types";
import { createEmbed, createMusicEmbed } from "@zuikaku/Utils";
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
        const getGuildDatabase = await this.client.database.entity.guilds.get(ctx.guild!.id);
        const fromGuildPlayer = getGuildDatabase?.guildPlayer?.channelId === ctx.channel?.id;
        if (getGuildDatabase?.guildPlayer?.channelId && getGuildDatabase.guildPlayer.channelId !== ctx.channel?.id) {
            await ctx.send({
                embeds: [
                    createEmbed("info", `**<a:decline:879311910045097984> | Operation Canceled. This command is restrictred to ${this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId)?.toString() ?? "unknown"} ** `)
                ]
            })
                .catch(() => null);
            return undefined;
        }
        const getUserDatabase = await this.client.database.entity.users.get(ctx.author.id);
        if (!getUserDatabase) {
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", "I am sorry, but you don't have any playlist database")
                ]
            })
                .catch(() => null);
            return undefined;
        }
        const getUserPlaylist = getUserDatabase.playlists.find(
            ({ playlistId }) => playlistId === ctx.options!.getString("playlist")!
        );
        if (!getUserPlaylist) {
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", "I am sorry, but you don't have any playlist matches that id")
                ]
            })
                .catch(() => null);
            return undefined;
        }
        if (getUserPlaylist.playlistTracks.length) {
            const guildQueue = await this.client.shoukaku.handleJoin({
                guildId: ctx.guild!.id,
                channelId: ctx.member!.voice.channel!.id,
                shardId: ctx.guild!.shard.id,
                textId: ctx.channel!.id,
                voiceId: ctx.member!.voice.channel!.id
            });
            const buildUnresolved = getUserPlaylist.playlistTracks.map(
                (x: PlaylistTrack) => this.client.shoukaku.plugin.buildUnresolved(x)
            );
            const buildResponse = this.client.shoukaku.plugin.buildResponse("PLAYLIST_LOADED", buildUnresolved, { name: getUserPlaylist.playlistName, selectedTrack: -1 });
            await guildQueue.addTrack(
                buildResponse.tracks.map(track => {
                    Object.defineProperty(track, "requester", {
                        value: ctx.author,
                        enumerable: true,
                        configurable: true
                    });
                    Object.defineProperty(track, "durationFormated", {
                        value: this.client.utils.parseMs(track.info.length!, { colonNotation: true }).colonNotation,
                        enumerable: true,
                        configurable: true
                    });
                    return track;
                })
            );
            if (fromGuildPlayer) await this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!);
            await ctx.send({
                embeds: [
                    // eslint-disable-next-line no-eval
                    createMusicEmbed(ctx, "info", `I enqueued ${buildResponse.tracks.length} track(s) from ${Util.escapeMarkdown(getUserPlaylist.playlistName)} (${this.client.utils.parseMs(Number(eval(buildResponse.tracks.map(({ info }) => info.length).join("+"))), { colonNotation: true }).colonNotation})`)
                ]
            })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            if (guildQueue._timeout || !guildQueue.player.track) await guildQueue.playTrack();
        } else {
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", `I am sorry, but your playlist ${getUserPlaylist.playlistName}(${getUserPlaylist.playlistId}) don't have any tracks`)
                ]
            })
                .catch(() => null);
        }
    }
}
