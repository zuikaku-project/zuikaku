/* eslint-disable max-lines */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, createMusicEmbed, Utils } from "@zuikaku/Utils";
import { MessageActionRow, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "drop",
    description: "Drop (delete) the playlist or track from user database",
    usage: "{CATEGORY} drop playlist|track {ABRACKETSL}id{ABRACKETSR} ?{ABRACKETSL}trackid{ABRACKETSR}",
    slash: {
        type: "SUB_COMMAND_GROUP",
        options: [
            {
                name: "playlist",
                description: "Drop (delete) playlist",
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
            },
            {
                name: "track",
                description: "Drop (delete) track from the playlist",
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
                        name: "trackid",
                        description: "trackId",
                        type: "STRING",
                        required: true
                    }
                ]
            }
        ]
    }
})
export default class DropPlaylistCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.entity.guilds.get(ctx.guild!.id))
                ?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred)
            await ctx.deferReply(fromGuildPlayer);
        const getUserDatabase = await this.client.database.entity.users.get(
            ctx.author.id
        );
        if (!getUserDatabase) {
            await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        "I am sorry, but you don't have any playlist database"
                    )
                ]
            });
            return undefined;
        }
        const asksButton = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("accept")
                .setLabel("Accept")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId("decline")
                .setLabel("Decline")
                .setStyle("DANGER")
        );
        if (ctx.options?.getSubcommand(false) === "playlist") {
            const getUserPlaylist = getUserDatabase.playlists.find(
                ({ playlistId }) =>
                    playlistId === ctx.options!.getString("playlist")!
            );
            if (!getUserPlaylist) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "I am sorry, but you don't have any playlist matches that id "
                        )
                    ]
                });
                return undefined;
            }
            const sendMessageForCollector = await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        `I will drop playlist ${getUserPlaylist.playlistName}, continue?`
                    )
                ],
                components: [asksButton]
            });
            const buttonCollector =
                sendMessageForCollector.createMessageComponentCollector({
                    filter: x => ["accept", "decline"].includes(x.customId),
                    time: 10000
                });
            buttonCollector.on("collect", async interaction => {
                if (interaction.user.id === ctx.author.id) {
                    if (interaction.customId === "accept") {
                        getUserDatabase.playlists =
                            getUserDatabase.playlists.filter(
                                ({ playlistId }) =>
                                    playlistId !== getUserPlaylist.playlistId
                            );
                        if (getUserDatabase.playlists.length) {
                            await this.client.database.entity.users.set(
                                ctx.author.id,
                                "playlists",
                                getUserDatabase.playlists
                            );
                        } else {
                            await this.client.database.entity.users.drop(
                                ctx.author.id
                            );
                        }
                        await ctx
                            .send({
                                embeds: [
                                    createMusicEmbed(
                                        ctx,
                                        "info",
                                        `I have dropped your playlist ${getUserPlaylist.playlistName} (${getUserPlaylist.playlistId})`
                                    )
                                ],
                                components: []
                            })
                            .catch(() => null);
                    } else {
                        await ctx
                            .send({
                                embeds: [
                                    createMusicEmbed(
                                        ctx,
                                        "info",
                                        "You have canceled command"
                                    )
                                ],
                                components: []
                            })
                            .catch(() => null);
                    }
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
                await interaction.deferUpdate();
                buttonCollector.stop("finished");
            });
            buttonCollector.on("end", (_, reason) => {
                if (reason !== "finished")
                    void ctx
                        .send({
                            embeds: [
                                createEmbed(
                                    "error",
                                    "**The request has been canceled because no respond!**"
                                )
                            ],
                            components: []
                        })
                        .catch(() => null);
            });
        } else {
            const getUserPlaylist = getUserDatabase.playlists.find(
                ({ playlistId }) =>
                    playlistId === ctx.options!.getString("playlist")!
            );
            if (!getUserPlaylist) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "I am sorry, but you don't have any playlist matches that id "
                        )
                    ]
                });
                return undefined;
            }
            const getPlaylistTrack = getUserPlaylist.playlistTracks.find(
                ({ trackId }) => trackId === ctx.options!.getString("trackid")!
            );
            if (!getPlaylistTrack) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `I am sorry, but your playlist ${getUserPlaylist.playlistName} (${getUserPlaylist.playlistId}) don't have any tracks matches that trackId`
                        )
                    ]
                });
                return undefined;
            }
            const sendMessageForCollector = await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        `I will drop track ${getPlaylistTrack.trackTitle} (${getPlaylistTrack.trackId}) from playlist ${getUserPlaylist.playlistName} (${getUserPlaylist.playlistId}), continue?`
                    )
                ],
                components: [asksButton]
            });
            const buttonCollector =
                sendMessageForCollector.createMessageComponentCollector({
                    filter: x => ["accept", "decline"].includes(x.customId),
                    time: 10000
                });
            buttonCollector.on("collect", async interaction => {
                if (interaction.user.id === ctx.author.id) {
                    if (interaction.customId === "accept") {
                        getUserPlaylist.playlistTracks =
                            getUserPlaylist.playlistTracks.filter(
                                ({ trackId }) =>
                                    trackId !== getPlaylistTrack.trackId
                            );
                        getUserPlaylist.playlistDuration = Utils.parseMs(
                            // eslint-disable-next-line no-eval
                            eval(
                                getUserPlaylist.playlistTracks
                                    .map(({ trackLength }) => trackLength)
                                    .join("+")
                            ) as unknown as number,
                            { colonNotation: true }
                        ).colonNotation;
                        await this.client.database.entity.users.set(
                            ctx.author.id,
                            "playlists",
                            getUserDatabase.playlists
                        );
                        await ctx
                            .send({
                                embeds: [
                                    createMusicEmbed(
                                        ctx,
                                        "info",
                                        `I have dropped track${getPlaylistTrack.trackTitle} (${getPlaylistTrack.trackId}) from playlist ${getUserPlaylist.playlistName} (${getUserPlaylist.playlistId})`
                                    )
                                ],
                                components: []
                            })
                            .catch(() => null);
                    } else {
                        await ctx
                            .send({
                                embeds: [
                                    createMusicEmbed(
                                        ctx,
                                        "info",
                                        "You have canceled command"
                                    )
                                ],
                                components: []
                            })
                            .catch(() => null);
                    }
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
                await interaction.deferUpdate();
                buttonCollector.stop("finished");
            });
            buttonCollector.on("end", (_, reason) => {
                if (reason !== "finished")
                    void ctx
                        .send({
                            embeds: [
                                createEmbed(
                                    "error",
                                    "**The request has been canceled because no respond!**"
                                )
                            ],
                            components: []
                        })
                        .catch(() => null);
            });
        }
    }
}
