/* eslint-disable max-lines */
import { documentType, IGuildSchema } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import {
    Guild,
    Message,
    MessageButton,
    StageChannel,
    TextChannel,
    ThreadChannel,
    VoiceChannel
} from "discord.js";
import { JoinOptions, ShoukakuPlayer } from "shoukaku";
import { ShoukakuHandler } from "../ShoukakuHandler";
import { EmbedPlayer } from "./EmbedPlayer";
import { Filter } from "./Filter";
import { Queue } from "./Queue";

export class Dispatcher {
    public readonly client = this.shoukaku.client;
    public guildId = this.opts.guildId;
    public voiceId = this.opts.voiceId ?? null;
    public textId = this.opts.textId ?? null;
    public trackRepeat = false;
    public queueRepeat = false;
    public filter = new Filter(this.player);
    public queue = new Queue(this);
    public volume = 0;
    public queueMessage!: Record<
        "lastNowplayingMessage" | "lastPlayerMessage" | "lastResolvingMessage",
        Message | null
    >;

    public queueChecker!: Record<
        "_isFromPrevious" | "_isResolved" | "_isStopped",
        boolean
    >;

    public _timeout!: NodeJS.Timeout | null;
    public constructor(
        public readonly shoukaku: ShoukakuHandler,
        public readonly player: ShoukakuPlayer,
        public readonly opts: JoinOptions
    ) {
        Object.defineProperties(this, {
            queueMessage: {
                value: {
                    lastNowplayingMessage: null,
                    lastPlayerMessage: null,
                    lastResolvingMessage: null
                },
                enumerable: true,
                writable: true
            },
            queueChecker: {
                value: {
                    _isFromPrevious: false,
                    _isResolved: true,
                    _isStopped: false
                },
                writable: true
            },
            _timeout: {
                value: null,
                writable: true
            }
        });
        this.shoukaku.dispatcher.set(opts.guildId, this);
    }

    public get getGuild(): Guild | undefined {
        return this.shoukaku.client.guilds.cache.get(this.guildId);
    }

    public get getGuildDatabase(): Promise<
        documentType<IGuildSchema> | undefined
    > {
        return this.shoukaku.client.database.manager.guilds.get(this.guildId);
    }

    public get getEmbedPlayer(): EmbedPlayer | undefined {
        return this.shoukaku.embedPlayers.get(this.guildId);
    }

    public get getVoice(): StageChannel | VoiceChannel | undefined {
        return this.getGuild?.channels.cache.get(this.voiceId ?? "") as
            | StageChannel
            | VoiceChannel
            | undefined;
    }

    public get getText(): TextChannel | ThreadChannel | undefined {
        return this.getGuild?.channels.cache.get(this.textId ?? "") as
            | TextChannel
            | ThreadChannel
            | undefined;
    }

    public async playTrack(startTime = 0): Promise<void> {
        if (!this.queueChecker._isResolved) return;
        if (this.queue.current) {
            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = null;
            }
            if (this.getVoice?.type === "GUILD_STAGE_VOICE") {
                await this.getGuild?.me?.voice.setSuppressed(false);
            }
            if (!this.queue.current.track.length) {
                this.queueChecker._isResolved = false;
                await this.getText
                    ?.send({
                        embeds: [
                            createEmbed(
                                "info",
                                "**<a:loading:804201332243955734> | Resolving track...**"
                            )
                        ]
                    })
                    .then(x => (this.queueMessage.lastResolvingMessage = x))
                    .catch(() => null);
                await this.queue.current
                    .resolve()
                    .then(async () => {
                        this.queueChecker._isResolved = true;
                        await this.queueMessage.lastResolvingMessage?.delete();
                        this.queueMessage.lastResolvingMessage = null;
                    })
                    .catch(async () => {
                        await this.queueMessage.lastResolvingMessage
                            ?.edit({
                                embeds: [
                                    createEmbed("info").setAuthor({
                                        name: `Unable to resolve ${
                                            this.queue.current?.info.uri ??
                                            this.queue.current?.info.title ??
                                            "UNKNOWN_TRACK"
                                        }. Skipping...`,
                                        iconURL:
                                            this.shoukaku.client.user!.displayAvatarURL()
                                    })
                                ]
                            })
                            .catch(() => null);
                        this.queueMessage.lastResolvingMessage = null;
                        this.queueChecker._isResolved = true;
                        return this.shoukaku.emit(
                            "playerTrackEnd",
                            this.player
                        );
                    });
            }
            this.player.playTrack(this.queue.current.track, {
                startTime: this.queue.current.info.uri?.startsWith(
                    "https://open.spotify.com"
                )
                    ? undefined
                    : startTime
            });
        }
    }

    public async playPrevious(): Promise<void> {
        if (this.queue.previous) {
            if (this.queue.current) {
                this.queueChecker._isFromPrevious = true;
                this.queue.tracks.unshift(this.queue.current);
                this.queue.tracks.unshift(this.queue.previous);
                this.queue.previous = null;
                this.stopTrack();
            } else {
                await this.queue.addTrack(this.queue.previous);
                this.queue.previous = null;
                if (this._timeout || !this.player.track) await this.playTrack();
            }
        }
    }

    public stopTrack(): this {
        this.player.stopTrack();
        return this;
    }

    public destroyPlayer(): this {
        this.queueChecker._isStopped = true;
        if (this.queueMessage.lastPlayerMessage)
            this.queueMessage.lastPlayerMessage.delete().catch(() => null);
        if (this.queueMessage.lastNowplayingMessage)
            this.queueMessage.lastNowplayingMessage.delete().catch(() => null);
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        this.player.connection.disconnect();
        void this.getGuildDatabase.then(guildSettings => {
            if (guildSettings?.guildPlayer?.channelId)
                setTimeout(() => this.getEmbedPlayer?.update(), 500);
        });
        return this;
    }

    public setTimeout(time: number, message: string): NodeJS.Timeout {
        this._timeout = setTimeout(() => {
            this.getText
                ?.send({ embeds: [createEmbed("info", `**${message}**`)] })
                .then(async x => {
                    if ((await this.getGuildDatabase)?.guildPlayer?.channelId) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            this.destroyPlayer();
        }, time).unref();
        return this._timeout;
    }

    public async setTrackRepeat(active = true): Promise<this> {
        if (active) {
            this.trackRepeat = true;
            this.queueRepeat = false;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId)
            setTimeout(() => this.getEmbedPlayer?.update(), 500);
        if (this.queueMessage.lastPlayerMessage) {
            const row = this.queueMessage.lastPlayerMessage.components[0];
            const findRepeatButton = row.components.find(
                x =>
                    Utils.encodeDecodeBase64String(
                        x.customId ?? "",
                        true
                    ).split("_")[1] === "REPEAT"
            ) as MessageButton | undefined;
            if (findRepeatButton) {
                if (active) {
                    findRepeatButton
                        .setEmoji(":no_repeat:941342881845768282")
                        .setLabel("DISABLE");
                } else {
                    findRepeatButton
                        .setEmoji(":repeat:891234382097031168")
                        .setLabel("QUEUE");
                }
            }
            await this.queueMessage.lastPlayerMessage
                .edit({ components: [row] })
                .catch(() => null);
        }
        return this;
    }

    public async setQueueRepeat(active = true): Promise<this> {
        if (active) {
            this.trackRepeat = false;
            this.queueRepeat = true;
        } else {
            this.trackRepeat = false;
            this.queueRepeat = false;
        }
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId)
            setTimeout(() => this.getEmbedPlayer?.update(), 500);
        if (this.queueMessage.lastPlayerMessage) {
            const row = this.queueMessage.lastPlayerMessage.components[0];
            const findRepeatButton = row.components.find(
                x =>
                    Utils.encodeDecodeBase64String(
                        x.customId ?? "",
                        true
                    ).split("_")[1] === "REPEAT"
            ) as MessageButton | undefined;
            if (findRepeatButton) {
                if (active) {
                    findRepeatButton
                        .setEmoji(":repeat_one:924117419960725534")
                        .setLabel("TRACK");
                } else {
                    findRepeatButton
                        .setEmoji(":repeat:891234382097031168")
                        .setLabel("QUEUE");
                }
            }
            await this.queueMessage.lastPlayerMessage
                .edit({ components: [row] })
                .catch(() => null);
        }
        return this;
    }

    public async setPaused(paused = true): Promise<this> {
        this.player.setPaused(paused);
        if (paused) {
            this.setTimeout(
                2 * 6e5,
                "I've paused for 20 minutes, destroying player!"
            );
        } else {
            clearTimeout(this._timeout!);
        }
        if (this.queueMessage.lastPlayerMessage) {
            const row = this.queueMessage.lastPlayerMessage.components[0];
            const findPlayPauseButton = row.components.find(
                x =>
                    Utils.encodeDecodeBase64String(
                        x.customId ?? "",
                        true
                    ).split("_")[1] === "PLAY-PAUSE"
            ) as MessageButton | undefined;
            if (findPlayPauseButton) {
                if (paused) {
                    findPlayPauseButton
                        .setEmoji(":play:941327026160283680")
                        .setLabel("PLAY");
                } else {
                    findPlayPauseButton
                        .setEmoji(":pause:941343422017581086")
                        .setLabel("PAUSE");
                }
            }
            await this.queueMessage.lastPlayerMessage
                .edit({ components: [row] })
                .catch(() => null);
        }
        return this;
    }

    public setVolume(volume: number): this {
        this.player.setVolume(volume / 100);
        this.volume = volume;
        return this;
    }
}
