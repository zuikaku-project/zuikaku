/* eslint-disable max-depth, max-lines */
import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { Dispatcher, EmbedPlayer } from "#zuikaku/Handlers/ShoukakuExtension";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { ICommandComponent, IListenerComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";
import {
    ButtonInteraction,
    GuildChannel,
    GuildMember,
    Interaction,
    Message,
    NewsChannel,
    TextChannel,
    ThreadChannel
} from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuInteractionCreate",
    event: "interactionCreate",
    emitter: "client"
})
export default class ZuikakuInteractionCreate extends ZuikakuListener {
    public async execute(interaction: Interaction): Promise<void> {
        if (!interaction.inGuild()) return;
        const context = new CommandContext(this.client, interaction);

        if (interaction.isButton()) {
            try {
                const decodeBase64Interaction = Utils.encodeDecodeBase64String(
                    interaction.customId,
                    true
                );
                if (decodeBase64Interaction.startsWith("Player")) {
                    const getDecodeCommand = decodeBase64Interaction.split(
                        "_"
                    )[1] as
                        | "LAST-TRACK"
                        | "NEXT-TRACK"
                        | "PLAY-PAUSE"
                        | "REPEAT"
                        | "SHUFFLE"
                        | "STOP";
                    const dispatcher = this.client.shoukaku.dispatcher.get(
                        interaction.guild!.id
                    );
                    const member = interaction.guild?.members.cache.get(
                        interaction.user.id
                    );
                    const vc = interaction.guild?.channels.cache.get(
                        member?.voice.channelId ?? ""
                    ) as GuildChannel | undefined;
                    if (!vc) {
                        await interaction.deferReply({ ephemeral: true });
                        const msg = await interaction.followUp({
                            embeds: [
                                createEmbed(
                                    "info",
                                    "**<a:decline:879311910045097984> | Operation Canceled. " +
                                        "You need to join voice channel to using this button**"
                                )
                            ]
                        });
                        setTimeout(
                            () => (msg as Message).delete().catch(() => null),
                            5000
                        );
                        return;
                    }
                    if (
                        interaction.guild?.me?.voice.channelId &&
                        interaction.guild.me.voice.channelId !==
                            member?.voice.channelId
                    ) {
                        await interaction.deferReply({ ephemeral: true });
                        const msg = await interaction.followUp({
                            embeds: [
                                createEmbed(
                                    "info",
                                    "**<a:decline:879311910045097984> | Operation Canceled. " +
                                        "You must in same voice channel with me**"
                                )
                            ]
                        });
                        setTimeout(
                            () => (msg as Message).delete().catch(() => null),
                            5000
                        );
                        return;
                    }
                    if (dispatcher)
                        await this.handleButtonPlayer(
                            interaction,
                            getDecodeCommand,
                            dispatcher,
                            this.client.shoukaku.embedPlayers.get(
                                context.guild!.id
                            )
                        );
                }
                const user = decodeBase64Interaction.split("_")[0] ?? "";
                const getDecodeCommand =
                    decodeBase64Interaction.split("_")[1] ?? "";
                if (getDecodeCommand === "deleteButton") {
                    if (interaction.user.id === user) {
                        const msg = await interaction.channel?.messages
                            .fetch(interaction.message.id)
                            .catch(() => null);
                        if (msg?.deletable)
                            await msg.delete().catch(() => null);
                    } else {
                        await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                createEmbed(
                                    "info",
                                    `**Sorry, but this interaction only for ${
                                        interaction.guild?.members.cache
                                            .get(user)
                                            ?.toString() ?? "unknown"
                                    }**`
                                )
                            ]
                        });
                    }
                }
            } catch (error: any) {
                this.client.emit("zuikakuError", context, error);
            }
        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName === "help") {
                const getCommandFromName =
                    interaction.options.getString("command");
                await interaction.respond(
                    getCommandFromName
                        ? this.client.command
                              .filter(command =>
                                  [
                                      command.meta.name,
                                      command.meta.category
                                  ].includes(
                                      getCommandFromName.split(" ")[0].trim()
                                  )
                              )
                              .map(command => ({
                                  name: `${command.meta.name} - ${command.meta
                                      .description!} `,
                                  value: command.meta.name
                              }))
                        : this.client.command
                              .filter(
                                  command => command.meta.slash !== undefined
                              )
                              .map(command => ({
                                  name: `${command.meta.name} - ${command.meta
                                      .description!} `,
                                  value: command.meta.name
                              }))
                              .sort((b, a) => b.name.localeCompare(a.name))
                              .slice(0, 25)
                );
            }
            if (interaction.commandName === "playlist") {
                if (
                    ["add", "load", "rename", "view", "playlist"].includes(
                        interaction.options.getSubcommand(false) ?? ""
                    ) ||
                    (interaction.options.getSubcommandGroup(false) === "drop" &&
                        interaction.options.getSubcommand(false) === "track")
                ) {
                    const getUserData =
                        this.client.database.manager.users.cache.get(
                            interaction.user.id
                        );
                    const getPlaylist =
                        interaction.options.getString("playlist");
                    if (getUserData) {
                        const getPlaylistFromId = getUserData.playlists.find(
                            playlist =>
                                [playlist.id, playlist.name].includes(
                                    getPlaylist?.split(" ")[0].trim() ?? ""
                                )
                        );
                        const getPlaylistData = getPlaylistFromId
                            ? [
                                  {
                                      name: `${getPlaylistFromId.name} - ${
                                          getPlaylistFromId.tracks.length
                                      } tracks (${
                                          Utils.parseMs(
                                              // eslint-disable-next-line no-eval
                                              eval(
                                                  getPlaylistFromId.tracks
                                                      .map(x => x.length)
                                                      .join("+")
                                              ) as number,
                                              { colonNotation: true }
                                          ).colonNotation
                                      })`,
                                      value: getPlaylistFromId.id
                                  }
                              ]
                            : getUserData.playlists
                                  .map(playlist => ({
                                      name: `${playlist.name} - ${
                                          playlist.tracks.length
                                      } tracks (${
                                          Utils.parseMs(
                                              // eslint-disable-next-line no-eval
                                              eval(
                                                  playlist.tracks
                                                      .map(x => x.length)
                                                      .join("+")
                                              ) as number,
                                              { colonNotation: true }
                                          ).colonNotation
                                      })`,
                                      value: playlist.id
                                  }))
                                  .sort((b, a) => b.name.localeCompare(a.name))
                                  .slice(0, 25);
                        await interaction.respond(getPlaylistData);
                    }
                }
            }
        }

        if (interaction.isContextMenu()) {
            const command = this.client.command.find(
                x => x.meta.contextChat === interaction.commandName
            );
            if (command) {
                try {
                    if (await this.runCommandCheck(context, command)) return;
                    await command.execute(context);
                } catch (error: any) {
                    this.client.emit("zuikakuError", context, error, command);
                } finally {
                    if (
                        command.meta.devOnly &&
                        !this.client.options.ownerId.includes(context.author.id)
                    )
                        // eslint-disable-next-line no-unsafe-finally
                        return;
                    this.client.logger.info(
                        "command manager",
                        `${(interaction.member as GuildMember).user.tag} •> ` +
                            `${command.meta.name} <•> ` +
                            `${interaction.guild!.name} <•> ` +
                            `#${(interaction.channel as TextChannel).name}`
                    );
                }
            } else {
                await interaction.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            "**<a:decline:879311910045097984> | Operation Canceled. Invalid Slash Command**"
                        )
                    ],
                    ephemeral: true
                });
            }
        }

        if (interaction.isCommand()) {
            const commandArray = this.client.command.filter(
                x => x.meta.slash !== undefined
            );
            const command =
                commandArray.find(
                    ({ meta }) =>
                        meta.category === interaction.commandName &&
                        meta.name ===
                            interaction.options.getSubcommandGroup(false)
                ) ??
                commandArray.find(
                    ({ meta }) =>
                        meta.category === interaction.commandName &&
                        meta.name === interaction.options.getSubcommand(false)
                ) ??
                commandArray.find(
                    ({ meta }) => meta.name === interaction.commandName
                );
            if (command) {
                try {
                    if (await this.runCommandCheck(context, command)) return;
                    await command.execute(context);
                } catch (error: any) {
                    this.client.emit("zuikakuError", context, error, command);
                } finally {
                    if (
                        command.meta.devOnly &&
                        !this.client.options.ownerId.includes(context.author.id)
                    )
                        // eslint-disable-next-line no-unsafe-finally
                        return;
                    this.client.logger.info(
                        "command manager",
                        `${(interaction.member as GuildMember).user.tag} •> ` +
                            `${command.meta.name} <•> ` +
                            `${interaction.guild!.name} <•> ` +
                            `#${(interaction.channel as TextChannel).name}`
                    );
                }
            } else {
                await interaction.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            "**<a:decline:879311910045097984> | Operation Canceled. Invalid Slash Command**"
                        )
                    ],
                    ephemeral: true
                });
            }
        }
    }

    private async runCommandCheck(
        context: CommandContext,
        command: ICommandComponent
    ): Promise<boolean> {
        if (
            command.meta.devOnly &&
            !this.client.options.ownerId.includes(context.author.id)
        )
            return true;
        if (command.meta.clientPermissions) {
            const missing = (
                context.channel as NewsChannel | TextChannel | ThreadChannel
            )
                .permissionsFor(this.client.user!.id)
                ?.missing(command.meta.clientPermissions);
            if (missing?.length) {
                if (!context.deferred) await context.deferReply();
                await context.send({
                    content:
                        "**<a:decline:879311910045097984> | Access Denied. " +
                        `\nMissing Permission for ${
                            this.client.user?.username ?? "unknown"
                        }: \`[${missing.join(", ")}]\`**`
                });
                return true;
            }
        }
        if (command.meta.userPermissions) {
            const missing = (
                context.channel as NewsChannel | TextChannel | ThreadChannel
            )
                .permissionsFor(context.author.id)
                ?.missing(command.meta.userPermissions);
            if (missing?.length) {
                if (!context.deferred) await context.deferReply();
                await context.send({
                    content:
                        "**<a:decline:879311910045097984> | Access Denied. " +
                        `\nMissing Permission for ${
                            context.author.username
                        }: \`[${missing.join(", ")}]\`**`
                });
                return true;
            }
        }
        if (
            this.client.shoukaku.embedPlayers.get(context.guild!.id)?.channel
                ?.id === context.channel!.id &&
            !["music", "music-filter", "playlist"].includes(
                command.meta.category!
            )
        ) {
            if (!context.deferred) await context.deferReply(true);
            await context.send({
                embeds: [
                    createEmbed(
                        "info",
                        "**<a:decline:879311910045097984> | Operation Canceled. Can't use slash command in Guild Player**"
                    )
                ]
            });
            return true;
        }
        return false;
    }

    private async handleButtonPlayer(
        interaction: ButtonInteraction,
        getDecodeCommand:
            | "LAST-TRACK"
            | "NEXT-TRACK"
            | "PLAY-PAUSE"
            | "REPEAT"
            | "SHUFFLE"
            | "STOP",
        dispatcher: Dispatcher,
        embedPlayer?: EmbedPlayer
    ): Promise<void> {
        await interaction.deferUpdate();
        if (embedPlayer?.channel?.id === interaction.channelId) {
            switch (getDecodeCommand) {
                case "STOP":
                    await dispatcher.destroyPlayer();
                    break;
                case "PLAY-PAUSE":
                    await dispatcher.setPaused(!dispatcher.player.paused);
                    break;
                case "LAST-TRACK":
                    break;
                case "NEXT-TRACK":
                    dispatcher.stopTrack();
                    break;
                case "REPEAT":
                    if (dispatcher.trackRepeat) {
                        await dispatcher.setQueueRepeat(false);
                        await dispatcher.setTrackRepeat(false);
                    } else if (dispatcher.queueRepeat) {
                        await dispatcher.setTrackRepeat();
                    } else {
                        await dispatcher.setQueueRepeat();
                    }
                    break;
                case "SHUFFLE":
                    dispatcher.queue.shuffleTrack();
                    break;
            }
        } else {
            switch (getDecodeCommand) {
                case "STOP":
                    await dispatcher.destroyPlayer();
                    break;
                case "PLAY-PAUSE":
                    await dispatcher.setPaused(!dispatcher.player.paused);
                    break;
                case "LAST-TRACK":
                    await dispatcher.playPrevious();
                    break;
                case "NEXT-TRACK":
                    dispatcher.stopTrack();
                    break;
                case "REPEAT":
                    if (dispatcher.trackRepeat) {
                        await dispatcher.setQueueRepeat(false);
                        await dispatcher.setTrackRepeat(false);
                    } else if (dispatcher.queueRepeat) {
                        await dispatcher.setTrackRepeat();
                    } else {
                        await dispatcher.setQueueRepeat();
                    }
                    break;
                case "SHUFFLE":
                    break;
            }
        }
    }
}
