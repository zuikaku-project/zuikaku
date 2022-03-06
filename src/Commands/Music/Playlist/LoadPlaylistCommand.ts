import { isNoNodesAvailable, isQueueReachLimit, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, isValidVoiceChannel, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
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
                name: "id",
                description: "Id of the playlist",
                type: "STRING",
                required: true
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
        const getGuildDatabase = await this.client.database.guilds.get(ctx.guild!.id);
        const fromGuildPlayer = getGuildDatabase?.guildPlayer?.channelId === ctx.channel?.id;
        if (getGuildDatabase?.guildPlayer?.channelId && getGuildDatabase.guildPlayer.channelId !== ctx.channel?.id) {
            await ctx.send({ embeds: [createEmbed("info", `**<a:decline:879311910045097984> | Operation Canceled. This command is restrictred to ${this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId)?.toString() ?? "unknown"} ** `)] });
            return undefined;
        }
        const getUserDatabase = await this.client.database.users.get(ctx.author.id);
        if (!getUserDatabase) {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "I am sorry, but you don't have any playlist database")] }).catch(() => null);
            return undefined;
        }
        const getUserPlaylist = getUserDatabase.playlists.find(({ playlistId }) => playlistId === ctx.options!.getString("id")!);
        if (!getUserPlaylist) {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "I am sorry, but you don't have any playlist matches that id")] });
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
            const getTracks = await Promise.all(getUserPlaylist.playlistTracks.map(({ trackURL }) => this.client.shoukaku.getTracks(trackURL).then(({ tracks }) => tracks[0])));
            await guildQueue.addTrack(getTracks.map(track => {
                Object.defineProperty(track, "requester", { value: ctx.author, enumerable: true, configurable: true });
                Object.defineProperty(track, "durationFormated", { value: this.client.utils.parseMs(track.info.length!, { colonNotation: true }).colonNotation, enumerable: true, configurable: true });
                return track;
            }));
            if (fromGuildPlayer) await this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!);
            // eslint-disable-next-line no-eval
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", `I enqueued ${getTracks.length} track(s) from ${Util.escapeMarkdown(getUserPlaylist.playlistName)}(${this.client.utils.parseMs(Number(eval(getTracks.map(({ info }) => info.length).join("+"))), { colonNotation: true }).colonNotation})`)] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
            if (guildQueue._timeout || !guildQueue.player.track) await guildQueue.playTrack();
        } else {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", `I am sorry, but your playlist ${getUserPlaylist.playlistName}(${getUserPlaylist.playlistId}) don't have any tracks`)] });
        }
    }
}
