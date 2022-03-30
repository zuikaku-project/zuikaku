/* eslint-disable max-lines */
import { createEmbed } from "@zuikaku/Utils";
import { Guild, Message, MessageButton, StageChannel, TextChannel, ThreadChannel, VoiceChannel } from "discord.js";
import { JoinOptions, ShoukakuPlayer, ShoukakuTrack } from "shoukaku";
import { GuildSettings } from "../Databases";
import { FilterManager } from "./FilterManager";
import { ShoukakuHandler } from "./ShoukakuHandler";

export class QueueManager {
    public options!: JoinOptions;
    public textId!: string | null;
    public voiceId!: string | null;
    public trackRepeat!: boolean;
    public queueRepeat!: boolean;
    public audioFilters!: FilterManager;
    public current!: ShoukakuTrack | null;
    public tracks!: ShoukakuTrack[];
    public previous!: ShoukakuTrack | null;
    public volume!: number;
    public playerMessage!: Record<"lastNowplayingMessage" | "lastPlayerMessage" | "lastResolvingMessage", Message | null>;
    public _timeout!: NodeJS.Timeout | null;
    public _isStopped!: boolean;
    public _isFromPrev!: boolean;
    public _isResolved!: boolean;
    public constructor(public shoukaku: ShoukakuHandler, public player: ShoukakuPlayer, opts: JoinOptions) {
        Object.defineProperty(this, "options", { value: opts });
        Object.defineProperty(this, "textId", { value: opts.textId ?? null, enumerable: true, writable: true });
        Object.defineProperty(this, "voiceId", { value: opts.voiceId ?? null, enumerable: true, writable: true });
        Object.defineProperty(this, "trackRepeat", { value: false, enumerable: true, writable: true });
        Object.defineProperty(this, "queueRepeat", { value: false, enumerable: true, writable: true });
        Object.defineProperty(this, "audioFilters", { value: new FilterManager(this.player), enumerable: true, writable: true });
        Object.defineProperty(this, "current", { value: null, enumerable: true, writable: true });
        Object.defineProperty(this, "tracks", { value: [], enumerable: true, writable: true });
        Object.defineProperty(this, "previous", { value: null, enumerable: true, writable: true });
        Object.defineProperty(this, "volume", { value: 0, enumerable: true, writable: true });
        Object.defineProperty(this, "playerMessage", {
            value: {
                lastPlayerMessage: null,
                lastNowplayingMessage: null,
                lastResolvingMessage: null
            },
            enumerable: true,
            writable: true
        });
        Object.defineProperty(this, "_timeout", { value: null, writable: true });
        Object.defineProperty(this, "_isStopped", { value: false, writable: true });
        Object.defineProperty(this, "_isFromPrev", { value: false, writable: true });
        Object.defineProperty(this, "_isResolved", { value: true, writable: true });
        this.shoukaku.queue.set(opts.guildId, this);
    }

    public get getGuild(): Guild | undefined {
        return this.shoukaku.client.guilds.cache.get(this.options.guildId);
    }

    public get getGuildDatabase(): Promise<GuildSettings | undefined> {
        return this.shoukaku.client.database.entity.guilds.get(this.options.guildId);
    }

    public get getVoice(): StageChannel | VoiceChannel | undefined {
        return this.getGuild?.channels.cache.get(this.options.voiceId ?? "") as StageChannel | VoiceChannel | undefined;
    }

    public get getText(): TextChannel | ThreadChannel | undefined {
        return this.getGuild?.channels.cache.get(this.options.textId ?? "") as TextChannel | ThreadChannel | undefined;
    }

    public get getTrackSize(): number {
        return this.tracks.length + (this.current ? 1 : 0);
    }

    public async addTrack(track: ShoukakuTrack | ShoukakuTrack[]): Promise<this> {
        if (!this.current) {
            if (!Array.isArray(track)) {
                this.current = track;
                return this as unknown as Promise<this>;
            }
            this.current = (track = [...track]).shift()!;
        }
        if (track instanceof Array) {
            this.tracks.push(...track);
        } else {
            this.tracks.push(track);
        }
        if (this.playerMessage.lastPlayerMessage) {
            const row = this.playerMessage.lastPlayerMessage.components[0];
            const findNextTrackButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "NEXT-TRACK") as MessageButton | undefined;
            if (findNextTrackButton) {
                findNextTrackButton.setDisabled(false).setStyle("PRIMARY");
                row.components.splice(3, 1, findNextTrackButton);
            }
            await this.playerMessage.lastPlayerMessage.edit({ components: [row] }).catch(() => null);
        }
        return this as unknown as Promise<this>;
    }

    public async removeTrack(track: number, range: number): Promise<ShoukakuTrack[]> {
        const spliced = this.tracks.splice(track, range ? range : 1);
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this.playerMessage.lastPlayerMessage && !this.tracks.length) {
            const row = this.playerMessage.lastPlayerMessage.components[0];
            const findNextTrackButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "NEXT-TRACK") as MessageButton | undefined;
            if (findNextTrackButton) {
                findNextTrackButton.setDisabled(true).setStyle("SECONDARY");
                row.components.splice(3, 1, findNextTrackButton);
            }
            await this.playerMessage.lastPlayerMessage.edit({ components: [row] }).catch(() => null);
        }
        return spliced;
    }

    public shuffleTrack(): this {
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }
        void this.getGuildDatabase.then(guildSettings => {
            if (guildSettings?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        });
        return this;
    }

    public async playTrack(startTime = 0): Promise<void> {
        if (!this._isResolved) return;
        const { requester, durationFormated } = this.current!;
        if (this.current) {
            if (this._timeout) {
                clearTimeout(this._timeout);
                this._timeout = null;
            }
            if (this.getVoice?.type === "GUILD_STAGE_VOICE") {
                await this.getGuild?.me?.voice.setSuppressed(false);
            }
            if (!this.current.track.length) {
                this._isResolved = false;
                await this.getText?.send({
                    embeds: [
                        createEmbed("info", "**<a:loading:804201332243955734> | Resolving track...**")
                    ]
                })
                    .then(x => this.playerMessage.lastResolvingMessage = x)
                    .catch(() => null);
                await this.current.resolve!()
                    .then(async () => {
                        this._isResolved = true;
                        await this.playerMessage.lastResolvingMessage?.delete();
                        this.playerMessage.lastResolvingMessage = null;
                    })
                    .catch(async () => {
                        await this.playerMessage.lastResolvingMessage?.edit({
                            embeds: [
                                createEmbed("info")
                                    .setAuthor({
                                        name: `Unable to resolve ${this.current?.info.uri ?? this.current?.info.title ?? "UNKNOWN_TRACK"}. Skipping...`,
                                        iconURL: this.shoukaku.client.user!.displayAvatarURL()
                                    })
                            ]
                        })
                            .catch(() => null);
                        this.playerMessage.lastResolvingMessage = null;
                        this._isResolved = true;
                        return this.shoukaku.emit("playerTrackEnd", this.player);
                    });
            }
            Object.defineProperty(this.current, "requester", { value: requester, enumerable: true, writable: true });
            Object.defineProperty(this.current, "durationFormated", { value: durationFormated, enumerable: true, writable: true });
            Object.defineProperty(this.current, "thumbnail", { value: await this.shoukaku.getThumbnail(this.current.info.uri!) });
            this.player.playTrack(this.current, { startTime: this.current.info.uri?.startsWith("https://open.spotify.com") ? undefined : startTime });
        }
    }

    public async playPrevious(): Promise<void> {
        if (this.previous) {
            if (this.current) {
                this._isFromPrev = true;
                this.tracks.unshift(this.current);
                this.tracks.unshift(this.previous);
                this.previous = null;
                this.stopTrack();
            } else {
                await this.addTrack(this.previous);
                this.previous = null;
                if (this._timeout || !this.player.track) await this.playTrack();
            }
        }
    }

    public stopTrack(): this {
        this.player.stopTrack();
        return this;
    }

    public destroyPlayer(): this {
        this._isStopped = true;
        if (this.playerMessage.lastPlayerMessage) this.playerMessage.lastPlayerMessage.delete().catch(() => null);
        if (this.playerMessage.lastNowplayingMessage) this.playerMessage.lastNowplayingMessage.delete().catch(() => null);
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        this.player.connection.disconnect();
        void this.getGuildDatabase.then(guildSettings => {
            if (guildSettings?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        });
        return this;
    }

    public setTimeout(time: number, message: string): NodeJS.Timeout {
        this._timeout = setTimeout(() => {
            this.getText?.send({ embeds: [createEmbed("info", `**${message}**`)] })
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
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this.playerMessage.lastPlayerMessage) {
            const row = this.playerMessage.lastPlayerMessage.components[0];
            const findRepeatButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "REPEAT") as MessageButton | undefined;
            if (findRepeatButton) {
                if (active) {
                    findRepeatButton.setEmoji(":no_repeat:941342881845768282").setLabel("DISABLE");
                } else {
                    findRepeatButton.setEmoji(":repeat:891234382097031168").setLabel("QUEUE");
                }
            }
            await this.playerMessage.lastPlayerMessage.edit({ components: [row] }).catch(() => null);
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
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this.playerMessage.lastPlayerMessage) {
            const row = this.playerMessage.lastPlayerMessage.components[0];
            const findRepeatButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "REPEAT") as MessageButton | undefined;
            if (findRepeatButton) {
                if (active) {
                    findRepeatButton.setEmoji(":repeat_one:924117419960725534").setLabel("TRACK");
                } else {
                    findRepeatButton.setEmoji(":repeat:891234382097031168").setLabel("QUEUE");
                }
            }
            await this.playerMessage.lastPlayerMessage.edit({ components: [row] }).catch(() => null);
        }
        return this;
    }

    public async setPaused(paused = true): Promise<this> {
        this.player.setPaused(paused);
        if (paused) {
            this.setTimeout(2 * 6e5, "I've paused for 20 minutes, destroying player!");
        } else {
            clearTimeout(this._timeout!);
        }
        if (this.playerMessage.lastPlayerMessage) {
            const row = this.playerMessage.lastPlayerMessage.components[0];
            const findPlayPauseButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "PLAY-PAUSE") as MessageButton | undefined;
            if (findPlayPauseButton) {
                if (paused) {
                    findPlayPauseButton.setEmoji(":play:941327026160283680").setLabel("PLAY");
                } else {
                    findPlayPauseButton.setEmoji(":pause:941343422017581086").setLabel("PAUSE");
                }
            }
            await this.playerMessage.lastPlayerMessage.edit({ components: [row] }).catch(() => null);
        }
        return this;
    }

    public setVolume(volume: number): this {
        this.player.setVolume(volume / 100);
        this.volume = volume;
        return this;
    }
}
