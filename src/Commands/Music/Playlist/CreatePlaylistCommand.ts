import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { documentType, ICommandComponent, IUserSchema } from "#zuikaku/types";
import { createEmbed, createMusicEmbed } from "#zuikaku/Utils";
import { randomBytes } from "crypto";
import { MessageActionRow, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "create",
    description: "Create Playlist",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    usage: "{CATEGORY} create {ABRACKETSL}name{ABRACKETSR}",
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "name",
                description: "Name of the playlist",
                type: "STRING",
                required: true
            }
        ]
    }
})
export default class CreatePlaylistCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred)
            await ctx.deferReply(fromGuildPlayer);
        const getUserDatabase =
            (await this.client.database.manager.users.get(ctx.author.id)) ??
            (await this.client.database.manager.users.set(
                ctx.author.id,
                "playlists",
                []
            ));
        const getUserPlaylist = getUserDatabase.playlists.find(
            ({ name }) => name === ctx.options!.getString("name")!
        );
        const newUserPlaylist = {
            id: this.getRandomPlaylistId(getUserDatabase),
            name: ctx.options!.getString("name")!,
            duration: "0",
            tracks: []
        };
        if (getUserPlaylist) {
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
            const sendMessageForCollector = await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        "You have a playlist with the same name, want to create one?"
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
                        getUserDatabase.playlists.push(newUserPlaylist);
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
                                    `I have created your new playlist ${newUserPlaylist.name} (${newUserPlaylist.id})`
                                )
                            ],
                            components: []
                        });
                    } else {
                        await ctx.send({
                            embeds: [
                                createMusicEmbed(
                                    ctx,
                                    "info",
                                    "You have canceled command"
                                )
                            ],
                            components: []
                        });
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
                        .then(x =>
                            setTimeout(() => x.delete().catch(() => null), 5000)
                        )
                        .catch(() => null);
            });
        } else {
            getUserDatabase.playlists.push(newUserPlaylist);
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
                        `I have created your new playlist ${newUserPlaylist.name} (${newUserPlaylist.id})`
                    )
                ]
            });
        }
    }

    private getRandomPlaylistId(
        userDatabase: documentType<IUserSchema>
    ): string {
        const getRandomHexFromBytes = randomBytes(3).toString("hex");
        if (
            userDatabase.playlists
                .map(({ id }) => id)
                .includes(getRandomHexFromBytes)
        )
            return this.getRandomPlaylistId(userDatabase);
        return getRandomHexFromBytes;
    }
}
