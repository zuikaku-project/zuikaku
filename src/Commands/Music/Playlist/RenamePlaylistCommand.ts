import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, createMusicEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "rename",
    description: "Renamed playlist",
    usage: "{CATEGORY} rename {ABRACKETSL}id{ABRACKETSR} {ABRACKETSL}name{ABRACKETSR}",
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
                name: "name",
                description: "New playlist name",
                type: "STRING",
                required: true
            }
        ]
    }
})
export default class RenamePlaylistCommand extends ZuikakuCommand {
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
        const getUserPlaylist = getUserDatabase.playlists.find(
            ({ id }) => id === ctx.options!.getString("playlist")!
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
                    `I will rename playlist ${
                        getUserPlaylist.name
                    } to ${ctx.options!.getString("name")!}, continue?`
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
                    getUserPlaylist.name = ctx.options!.getString("name")!;
                    await this.client.database.manager.users.set(
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
                                    `I have renamed your playlist to ${getUserPlaylist.name} (${getUserPlaylist.id})`
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
