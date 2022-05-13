import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { documentType, IGuildSchema } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import { TextChannel, Message, Guild, MessageActionRow } from "discord.js";
import { Dispatcher } from "./Dispatcher";

const defaultImage =
    "https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png";

export class EmbedPlayer {
    public channel: TextChannel | undefined;
    public message: Message | undefined;
    public constructor(
        public readonly client: ZuikakuClient,
        public readonly guild: Guild
    ) {
        this.client.shoukaku.embedPlayers.set(this.guild.id, this);
        this.client.logger.info(
            "embed player",
            `Embed Player has been assigned for guild ${this.guild.name}`
        );
    }

    public getGuildDatabase(): Promise<documentType<IGuildSchema> | undefined> {
        return this.client.database.manager.guilds.get(this.guild.id);
    }

    public getDispatcher(): Dispatcher | undefined {
        return this.client.shoukaku.dispatcher.get(this.guild.id);
    }

    public async update(): Promise<void> {
        const dispatcher = this.getDispatcher();
        if (!this.channel || !this.message) return;
        if (dispatcher?.queue.getTrackSize && dispatcher.queue.current) {
            const list = Utils.chunk(
                dispatcher.queue.tracks.map(
                    (x, i) =>
                        `**${++i}.** ${x.info.title!} [${
                            x.info.isStream
                                ? "◉ LIVE"
                                : x.durationFormated ?? "0:00"
                        }]`
                ),
                10
            );
            const display = dispatcher.queue.current.thumbnail ?? defaultImage;
            const embed = createEmbed("info")
                .setAuthor({
                    name: dispatcher.queue.current.info.title!,
                    iconURL: this.client.user?.displayAvatarURL({
                        format: "png",
                        size: 4096
                    }),
                    url: dispatcher.queue.current.info.uri
                })
                .setImage(display)
                .setFooter({
                    text: dispatcher.queue.tracks.length
                        ? `Zuikaku-ship | ${
                              dispatcher.queue.tracks.length
                          } Songs left ${
                              (
                                  dispatcher.trackRepeat
                                      ? "| loop: Track"
                                      : dispatcher.queueRepeat
                              )
                                  ? "| loop: Queue"
                                  : ""
                          }`
                        : `Zuikaku-ship ${
                              (
                                  dispatcher.trackRepeat
                                      ? "| loop: Track"
                                      : dispatcher.queueRepeat
                              )
                                  ? "| loop: Queue"
                                  : ""
                          }`
                });
            if (this.message.author.id === this.client.user?.id) {
                const components = new MessageActionRow().addComponents(
                    this.message.components[0].components.map(x =>
                        x.setDisabled(false)
                    )
                );
                await this.message
                    .edit({
                        embeds: [embed],
                        content: `**__Queue list:__**${
                            list.length > 1
                                ? `\n\n**And ${
                                      dispatcher.queue.getTrackSize -
                                      1 -
                                      list[0].length
                                  } more...**`
                                : ""
                        }\n${
                            list.length
                                ? list[0].reverse().join("\n")
                                : "Join a voice channel and request some song in here"
                        }`,
                        components: [components]
                    })
                    .catch(() => null);
            }
        } else {
            const embed = createEmbed("info")
                .setAuthor({
                    name: "Nothing are playing rightnow",
                    iconURL: this.client.user?.displayAvatarURL({
                        format: "png",
                        size: 4096
                    })
                })
                .setImage(
                    "https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png"
                )
                .setFooter({
                    text: "Zuikaku-ship"
                });
            if (this.message.author.id === this.client.user?.id) {
                const component = this.message.components[0].components
                    .slice(1)
                    .map(x => x.setDisabled());
                component.unshift(this.message.components[0].components[0]);
                const components = new MessageActionRow().addComponents(
                    this.guild.me?.voice.channelId
                        ? component
                        : this.message.components[0].components.map(x =>
                              x.setDisabled()
                          )
                );
                await this.message
                    .edit({
                        embeds: [embed],
                        content: " ",
                        components: [components]
                    })
                    .catch(() => null);
            }
        }
    }

    public async fetch(force = false): Promise<this> {
        if (this.channel && this.message && !force) return this;
        const guildDatabase = await this.getGuildDatabase();
        const resolveEmbedPlayer = await EmbedPlayer.resolve(
            this.guild,
            guildDatabase?.guildPlayer
        );
        if (!resolveEmbedPlayer.channel) {
            this.channel = undefined;
            this.message = undefined;
            return this;
        }
        this.channel = resolveEmbedPlayer.channel;
        this.message = resolveEmbedPlayer.message;
        return this;
    }

    public static async resolve(
        guild: Guild,
        data: documentType<IGuildSchema>["guildPlayer"]
    ): Promise<{ channel?: TextChannel; message?: Message }> {
        if (!data) {
            return {
                channel: undefined,
                message: undefined
            };
        }
        const dispatcher = guild.client.shoukaku.dispatcher.get(guild.id);
        const channel = guild.channels.resolve(data.channelId);
        if (!channel?.isText()) {
            if (dispatcher) {
                await guild.client.database.manager.guilds.reset(
                    guild.id,
                    "guildPlayer"
                );
            } else {
                await guild.client.database.manager.guilds.drop(guild.id);
            }
            return {
                channel: undefined,
                message: undefined
            };
        }
        const message = await (channel as TextChannel).messages
            .fetch(data.messageId)
            .catch(() => undefined);
        if (!message) {
            if (dispatcher) {
                await guild.client.database.manager.guilds.reset(
                    guild.id,
                    "guildPlayer"
                );
            } else {
                await guild.client.database.manager.guilds.drop(guild.id);
            }
            return {
                channel: undefined,
                message: undefined
            };
        }
        return {
            channel: channel as TextChannel,
            message
        };
    }
}
