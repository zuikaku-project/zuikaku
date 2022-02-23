import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { chunk, createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "list",
    description: "List playlist",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class ListPlaylistCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(fromGuildPlayer);
        const getUserDatabase = await this.client.database.users.get(ctx.author.id);
        if (!getUserDatabase) {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "I am sorry, but you don't have any playlist database")] }).catch(() => null);
            return undefined;
        }
        if (getUserDatabase.playlists.length) {
            const generateChunks = chunk(getUserDatabase.playlists, 5);
            let i = 1;
            const generateEmbeds = generateChunks.map(userPlaylist => createMusicEmbed(ctx, "info", `${ctx.author.username}'s Playlist`).setDescription(userPlaylist.map(({ playlistId, playlistName, playlistTracks }) => `**${i++} • \`${playlistId}\` | ${playlistName} (${playlistTracks.length} track(s))**`).join("\n")));
            await new this.client.utils.pagination(ctx, generateEmbeds).Pagination();
        } else {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "I am sorry, but your playlist database is empty")] });
        }
    }
}
