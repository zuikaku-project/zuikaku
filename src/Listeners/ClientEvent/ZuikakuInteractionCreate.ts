/* eslint-disable max-lines */
import { GuildSettings, QueueManager, ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { ICommandComponent, IListenerComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { APIMessage } from "discord-api-types";
import {
    ButtonInteraction,
    GuildChannel, GuildMember, Interaction, Message, MessageActionRow,
    MessageButton, NewsChannel, TextChannel, ThreadChannel, WebhookClient
} from "discord.js";
import petitio from "petitio";

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
                const decodeBase64Interaction = this.client.utils.encodeDecodeBase64String(interaction.customId, true);
                if (decodeBase64Interaction.startsWith("Player")) {
                    const getDecodeCommand = decodeBase64Interaction
                        .split("_")[1] as "LAST-TRACK" | "NEXT-TRACK" | "PLAY-PAUSE" | "REPEAT" | "SHUFFLE" | "STOP";
                    const getGuildDatabase = await this.client.database.guilds.get(interaction.guild!.id);
                    const getGuildQueue = this.client.shoukaku.queue.get(interaction.guild!.id);
                    const member = interaction.guild?.members.cache.get(interaction.user.id);
                    const vc = interaction.guild?.channels.cache.get(member?.voice.channelId ?? "") as GuildChannel | undefined;
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
                        setTimeout(() => this.isMessage(msg).delete().catch(() => null), 5000);
                        return;
                    }
                    if (
                        interaction.guild?.me?.voice.channelId &&
                        interaction.guild.me.voice.channelId !== member?.voice.channelId
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
                        setTimeout(() => this.isMessage(msg).delete().catch(() => null), 5000);
                        return;
                    }
                    if (getGuildQueue) await this.handleButtonPlayer(interaction, getDecodeCommand, getGuildQueue, getGuildDatabase);
                }
                const user = decodeBase64Interaction.split("_")[0] ?? "";
                const getDecodeCommand = decodeBase64Interaction.split("_")[1] ?? "";
                if (getDecodeCommand === "deleteButton") {
                    if (interaction.user.id === user) {
                        const msg = await interaction.channel?.messages.fetch(interaction.message.id).catch(() => null);
                        if (msg?.deletable) await msg.delete().catch(() => null);
                    } else {
                        await interaction.reply({
                            ephemeral: true,
                            embeds: [
                                createEmbed(
                                    "info",
                                    `**Sorry, but this interaction only for ${interaction.guild?.members.cache.get(user)?.toString() ?? "unknown"}**`
                                )
                            ]
                        });
                    }
                }
            } catch (error: any) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                await this.handleInteractionError(context, error);
            }
        }

        if (interaction.isAutocomplete()) {
            if (interaction.commandName === "help") {
                await interaction.respond(interaction.options.getString("command")
                    ? this.client.commands
                        .filter(
                            command => command.meta.name === interaction.options.getString("command")?.split(" ")[0].trim()
                        ).map(command => (
                            {
                                name: `${command.meta.name} - ${command.meta.description!} `,
                                value: command.meta.name
                            }
                        ))
                    : this.client.commands
                        .filter(command => command.meta.slash !== undefined)
                        .map(command => (
                            {
                                name: `${command.meta.name} - ${command.meta.description!} `,
                                value: command.meta.name
                            }
                        ))
                        .sort((b, a) => b.name.localeCompare(a.name))
                        .slice(0, 25));
            }
        }

        if (interaction.isContextMenu()) {
            const command = this.client.commands.find(x => x.meta.contextChat === interaction.commandName);
            if (command) {
                try {
                    if (await this.runCommandCheck(context, command)) return;
                    await command.execute(context);
                } catch (error: any) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    await this.handleInteractionError(context, error, command);
                } finally {
                    if (
                        command.meta.devOnly &&
                        !this.client.options.ownerId.includes(context.author.id)
                        // eslint-disable-next-line no-unsafe-finally
                    ) return;
                    this.client.logger.info({
                        module: "COMMAND_FINISHED",
                        message:
                            `${(interaction.member as GuildMember).user.tag} •> ` +
                            `${command.meta.name} <•> ` +
                            `${interaction.guild!.name} <•> ` +
                            `#${(interaction.channel as TextChannel).name} `
                    });
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
            const commandArray = this.client.commands.filter(x => x.meta.slash !== undefined);
            const command =
                commandArray
                    .find(({ meta }) => meta.category === interaction.commandName && meta.name === interaction.options.getSubcommandGroup(false)) ??
                commandArray
                    .find(({ meta }) => meta.category === interaction.commandName && meta.name === interaction.options.getSubcommand(false)) ??
                commandArray
                    .find(({ meta }) => meta.name === interaction.commandName);
            if (command) {
                try {
                    if (await this.runCommandCheck(context, command)) return;
                    await command.execute(context);
                } catch (error: any) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    await this.handleInteractionError(context, error, command);
                } finally {
                    if (
                        command.meta.devOnly &&
                        !this.client.options.ownerId.includes(context.author.id)
                        // eslint-disable-next-line no-unsafe-finally
                    ) return;
                    this.client.logger.info({
                        module: "COMMAND_FINISHED",
                        message:
                            `${(interaction.member as GuildMember).user.tag} •> ` +
                            `${command.meta.name} <•> ` +
                            `${interaction.guild!.name} <•> ` +
                            `#${(interaction.channel as TextChannel).name}`
                    });
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

    private isMessage(message: APIMessage | Message): Message {
        if (message instanceof Message) {
            return message;
        }
        // @ts-expect-error-next-line
        return new Message(this.client, message);
    }

    private async handleInteractionError(context: CommandContext, error: Error, command?: ICommandComponent): Promise<void> {
        const embedLog = createEmbed("error")
            .setTitle(`Oof! An error occurred! ${command ? `| ${command.meta.name} command` : ""} `);
        if (error.stack!.length > 4050) {
            const { key } = await petitio("https://hastebin.orchitiadi.repl.co/documents", "POST")
                .body(error.stack!)
                .json();
            embedLog
                .setDescription(`** StackTrack **\nhttps://hastebin.orchitiadi.repl.co/${key as string}`);
        } else {
            embedLog
                .setDescription(`**StackTrack**\n\`\`\`bash\n${error.stack!}\n\`\`\``);
        }
        const webhook = new WebhookClient({
            url:
                "https://discord.com/api/webhooks/875557647401762918/2TRNR30WOfcFy7kpeSajcvx_tvhHsGoiTkOFOf-c4B8HqhgyAjGhCzuKs1Oy3OnnGm3z"
        });
        await webhook.send({
            embeds: [embedLog]
        }).catch(() => null);
        await context.send({
            embeds: [
                createEmbed(
                    "error",
                    `\`\`\`bash\n${String(error.message)}\n\`\`\`\n**This Error has been send to developers**`
                )
                    .setAuthor({ name: "Oof! An error occurred!" })
            ],
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setURL("https://discord.gg/U4ynfYRYj9")
                            .setLabel("Support Server")
                            .setStyle("LINK")
                    )
            ]
        }).catch(() => null);
    }

    private async runCommandCheck(context: CommandContext, command: ICommandComponent): Promise<boolean> {
        const getGuildDatabase = await this.client.database.guilds.get(context.guild!.id);
        if (
            command.meta.devOnly &&
            !this.client.options.ownerId.includes(context.author.id)
        ) return true;
        if (command.meta.clientPermissions) {
            const missing = (context.channel as NewsChannel | TextChannel | ThreadChannel)
                .permissionsFor(this.client.user!.id)?.missing(command.meta.clientPermissions);
            if (missing!.length) {
                if (!context.deferred) {
                    await context.deferReply();
                }
                await context.send({
                    content:
                        "**<a:decline:879311910045097984> | Access Denied. " +
                        `\nMissing Permission for ${this.client.user?.username ?? "unknown"}: \`[${missing?.join(", ") ?? "unknown missing"}]\`**`
                });
                return true;
            }
        }
        if (command.meta.userPermissions) {
            const missing = (context.channel as NewsChannel | TextChannel | ThreadChannel)
                .permissionsFor(context.author.id)?.missing(command.meta.userPermissions);
            if (missing!.length) {
                if (!context.deferred) {
                    await context.deferReply();
                }
                await context.send({
                    content:
                        "**<a:decline:879311910045097984> | Access Denied. " +
                        `\nMissing Permission for ${context.author.username}: \`[${missing?.join(", ") ?? "unknown missing"}]\`**`
                });
                return true;
            }
        }
        if (
            getGuildDatabase?.guildPlayer?.channelId === context.channel!.id &&
            !["music", "music-filter", "playlist"].includes(command.meta.category!)
        ) {
            if (!context.deferred) {
                await context.deferReply(true);
            }
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

    private async handleButtonPlayer(interaction: ButtonInteraction, getDecodeCommand: "LAST-TRACK" | "NEXT-TRACK" | "PLAY-PAUSE" | "REPEAT" | "SHUFFLE" | "STOP", getGuildQueue: QueueManager, getGuildDatabase?: GuildSettings): Promise<void> {
        if (getGuildDatabase?.guildPlayer?.channelId === interaction.channelId) {
            if (getDecodeCommand === "STOP") {
                getGuildQueue.destroyPlayer();
            }
            if (getDecodeCommand === "PLAY-PAUSE") {
                await getGuildQueue.setPaused(!getGuildQueue.player.paused);
            }
            if (getDecodeCommand === "NEXT-TRACK") {
                getGuildQueue.stopTrack();
            }
            if (getDecodeCommand === "REPEAT") {
                if (getGuildQueue.trackRepeat) {
                    await getGuildQueue.setQueueRepeat(false);
                    await getGuildQueue.setTrackRepeat(false);
                }
                if (getGuildQueue.queueRepeat) {
                    await getGuildQueue.setTrackRepeat();
                }
                await getGuildQueue.setQueueRepeat();
            }
            if (getDecodeCommand === "SHUFFLE") {
                getGuildQueue.shuffleTrack();
            }
        } else {
            if (getDecodeCommand === "STOP") {
                getGuildQueue.destroyPlayer();
            }
            if (getDecodeCommand === "PLAY-PAUSE") {
                if (getGuildQueue.player.paused) {
                    await getGuildQueue.setPaused(false);
                } else {
                    await getGuildQueue.setPaused();
                }
            }
            if (getDecodeCommand === "LAST-TRACK") {
                await getGuildQueue.playPrevious();
            }
            if (getDecodeCommand === "NEXT-TRACK") {
                getGuildQueue.stopTrack();
            }
            if (getDecodeCommand === "REPEAT") {
                if (getGuildQueue.queueRepeat) {
                    await getGuildQueue.setTrackRepeat();
                } else if (getGuildQueue.trackRepeat) {
                    await getGuildQueue.setQueueRepeat(false);
                    await getGuildQueue.setTrackRepeat(false);
                } else {
                    await getGuildQueue.setQueueRepeat();
                }
            }
        }
        await interaction.deferUpdate();
    }
}
