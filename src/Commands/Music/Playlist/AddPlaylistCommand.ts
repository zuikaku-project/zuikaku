import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { documentType, ICommandComponent, IUserSchema } from "#zuikaku/types";
import { createEmbed, createMusicEmbed, Utils } from "#zuikaku/Utils";
import { randomBytes } from "crypto";
import { MessageActionRow, MessageSelectMenu } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "add",
    description: "Add track(s) into some playlist",
    usage: "{CATEGORY} add {ABRACKETSL}id{ABRACKETSR} {ABRACKETSL}track{ABRACKETSR}",
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
            },
            {
                name: "track",
                description: "Track(s) you want to add",
                type: "STRING",
                required: true
            }
        ]
    }
})
export default class AddPlaylistCommand extends ZuikakuCommand {
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
                        "I canceled this command because you don't hava any playlist matches that id"
                    )
                ]
            });
            return undefined;
        }
        const getTracks = await this.client.shoukaku.getTracks(
            ctx.options!.getString("track")!
        );
        if (
            ["LOAD_FAILED", "NO_MATCHES"].includes(getTracks.type) ||
            !getTracks.tracks.length
        ) {
            await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        `I can't get any result for ${ctx.options!.getString(
                            "track"
                        )!}`
                    )
                ]
            });
            return undefined;
        }
        const getLazyTracks = getTracks.tracks.map(({ info, isrc }) => ({
            id: this.getRandomTrackId(getUserPlaylist),
            author: info.author!,
            title: info.title!,
            url: info.uri!,
            length: info.length!,
            artwork: info.artworkUrl ?? "",
            source: info.sourceName!,
            ISRC: isrc ?? ""
        }));
        if (getTracks.type === "PLAYLIST") {
            getUserPlaylist.tracks.push(...getLazyTracks);
        } else {
            getUserPlaylist.tracks.push(getLazyTracks[0]);
        }
        getUserPlaylist.duration = Utils.parseMs(
            // eslint-disable-next-line no-eval
            eval(
                getUserPlaylist.tracks.map(({ length }) => length).join("+")
            ) as unknown as number,
            { colonNotation: true }
        ).colonNotation;
        await this.client.database.manager.users.set(
            ctx.author.id,
            "playlists",
            getUserDatabase.playlists
        );
        await ctx.send({
            embeds: [
                createMusicEmbed(
                    ctx,
                    "info",
                    `I have finished adding ${
                        getTracks.type === "PLAYLIST"
                            ? getLazyTracks.length
                            : "1"
                    } track(s) to playlist ${getUserPlaylist.name}`
                )
            ]
        });
    }

    private getRandomTrackId(
        tracks: documentType<IUserSchema>["playlists"][0]
    ): string {
        const getRandomHexFromBytes = randomBytes(3).toString("hex");
        if (tracks.tracks.map(({ id }) => id).includes(getRandomHexFromBytes))
            return this.getRandomTrackId(tracks);
        return getRandomHexFromBytes;
    }

    private async generateSelectMenus(
        ctx: CommandContext,
        getTracks: TrackList
    ): Promise<{ trackAuthor: string; trackTitle: string; length: number }[]> {
        const finalSelectMenuTrack: {
            trackAuthor: string;
            trackTitle: string;
            length: number;
        }[] = [];
        const slicedTracks = getTracks.tracks.slice(0, 10);
        const selectMenuOptions = slicedTracks.map((track, i) => ({
            label: `${
                track.info.title!.length >= 90
                    ? `${track.info.title!.substring(0, 90)}...`
                    : track.info.title!
            }`,
            value: `${i++}`
        }));
        const SelectMenuComponent = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("SongSelect")
                .setMinValues(1)
                .setMaxValues(selectMenuOptions.length)
                .setPlaceholder("Select track(s) in here")
                .addOptions(selectMenuOptions)
        );
        const sendMessageForCollector = await ctx.send({
            embeds: [createMusicEmbed(ctx, "info", "Please select track(s)")],
            components: [SelectMenuComponent]
        });
        const collector =
            sendMessageForCollector.createMessageComponentCollector({
                filter: x =>
                    ["SongSelect", "deleteButton"].includes(x.customId),
                time: 30000
            });
        collector.on("collect", async interaction => {
            if (interaction.isSelectMenu()) {
                if (interaction.user.id === ctx.author.id) {
                    const resolveSelectMenuValue = interaction.values
                        .map(value => slicedTracks[Number(value)])
                        .map(({ info }) => ({
                            trackAuthor: info.author!,
                            trackTitle: info.title!,
                            length: info.length!
                        }));
                    finalSelectMenuTrack.push(...resolveSelectMenuValue);
                    // eslint-disable-next-line no-eval
                    await ctx.send({
                        embeds: [
                            createMusicEmbed(
                                ctx,
                                "info",
                                `I'll add ${resolveSelectMenuValue.length} track(s) to the playlist`
                            )
                        ]
                    });
                    await interaction.deferUpdate();
                    collector.stop("Finished");
                } else {
                    await interaction.reply({
                        embeds: [
                            createEmbed(
                                "info",
                                `**Sorry, but this interaction only for ${ctx.author.toString()}**`
                            )
                        ],
                        ephemeral: true
                    });
                }
            }
        });
        collector.on("end", async (_, reason) => {
            if (reason !== "Finished")
                await ctx
                    .send({
                        embeds: [
                            createMusicEmbed(
                                ctx,
                                "info",
                                "I canceled Select Menu because no respond"
                            )
                        ],
                        components: []
                    })
                    .catch(() => null);
        });
        return finalSelectMenuTrack;
    }
}
