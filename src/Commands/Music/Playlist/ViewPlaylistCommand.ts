import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { Utils, createMusicEmbed } from "#zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "view",
    description: "View playlist track(s)",
    usage: "{CATEGORY} view {ABRACKETSL}id{ABRACKETSR}",
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
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred)
            await ctx.deferReply(fromGuildPlayer);
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
            await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        "I am sorry, but you don't have any playlist matches that id"
                    )
                ]
            });
            return undefined;
        }
        if (getUserPlaylist.tracks.length) {
            let i = 1;
            const playlistTracksArray = getUserPlaylist.tracks.map(
                ({ id, title, length }) =>
                    `**${i++} • \`${id}\` | ${title} (${
                        Utils.parseMs(length, {
                            colonNotation: true
                        }).colonNotation
                    })**`
            );
            const generateTracksChunks = Utils.chunk(playlistTracksArray, 10);
            const generateEmbeds = generateTracksChunks.map(tracks =>
                createMusicEmbed(
                    ctx,
                    "info",
                    `Playlist ${getUserPlaylist.name} (${getUserPlaylist.id})`
                ).setDescription(tracks.join("\n"))
            );
            await new this.client.utils.pagination(
                ctx,
                generateEmbeds
            ).Pagination();
        } else {
            await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        `I am sorry, but your playlist ${getUserPlaylist.name} (${getUserPlaylist.id}) don't have any tracks`
                    )
                ]
            });
        }
    }
}
