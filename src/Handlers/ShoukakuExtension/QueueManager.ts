import { createEmbed } from "@zuikaku/Utils";
import { Guild, MessageButton, StageChannel, TextChannel, ThreadChannel, VoiceChannel } from "discord.js";
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
    public _lastMusicMessageId!: string | null;
    public _lastNowplayingMessageId!: string | null;
    public _timeout!: NodeJS.Timeout | null;
    public _isStopped!: boolean;
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
        Object.defineProperty(this, "_lastMusicMessageId", { value: null, writable: true });
        Object.defineProperty(this, "_lastNowplayingMessageId", { value: null, writable: true });
        Object.defineProperty(this, "_timeout", { value: null, writable: true });
        Object.defineProperty(this, "_isStopped", { value: false, writable: true });
        this.shoukaku.queue.set(opts.guildId, this);
    }

    public get getGuild(): Guild | undefined {
        return this.shoukaku.client.guilds.cache.get(this.options.guildId);
    }

    public get getGuildDatabase(): Promise<GuildSettings | undefined> {
        return this.shoukaku.client.database.guilds.get(this.options.guildId);
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
        if (this._lastMusicMessageId) {
            const getPlayerMessage = await this.getText?.messages.fetch(this._lastMusicMessageId).catch(() => null);
            if (getPlayerMessage) {
                const row = getPlayerMessage.components[0];
                const findNextTrackButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "NEXT-TRACK") as MessageButton | undefined;
                if (findNextTrackButton) {
                    findNextTrackButton.setDisabled(false).setStyle("PRIMARY");
                    row.components.splice(3, 1, findNextTrackButton);
                }
                await getPlayerMessage.edit({ components: [row] });
            }
        }
        return this as unknown as Promise<this>;
    }

    public async removeTrack(track: number, range: number): Promise<ShoukakuTrack[]> {
        const spliced = this.tracks.splice(track, range ? range : 1);
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this._lastMusicMessageId && !this.tracks.length) {
            const getPlayerMessage = await this.getText?.messages.fetch(this._lastMusicMessageId).catch(() => null);
            if (getPlayerMessage) {
                const row = getPlayerMessage.components[0];
                const findNextTrackButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "NEXT-TRACK") as MessageButton | undefined;
                if (findNextTrackButton) {
                    findNextTrackButton.setDisabled(true).setStyle("SECONDARY");
                    row.components.splice(3, 1, findNextTrackButton);
                }
                await getPlayerMessage.edit({ components: [row] });
            }
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
        const { requester, durationFormated } = this.current!;
        if (this.current) {
            if (this._timeout) {
                clearTimeout(this._timeout);
                Object.defineProperty(this, "_timeout", { value: null, writable: true });
            }
            if (this.getVoice?.type === "GUILD_STAGE_VOICE") await this.getGuild?.me?.voice.setSuppressed(false);
            if (!this.current.track.length) await this.current.resolve!();
            Object.defineProperty(this.current, "requester", { value: requester, enumerable: true, writable: true });
            Object.defineProperty(this.current, "durationFormated", { value: durationFormated, enumerable: true, writable: true });
            Object.defineProperty(this.current, "thumbnail", { value: await this.shoukaku.getThumbnail(this.current.info.uri!) });
            this.player.playTrack(this.current, { startTime });
        }
    }

    public async playPrevious(): Promise<void> {
        if (this.previous) {
            if (this.current) {
                this.tracks.unshift(this.current);
                this.tracks.unshift(this.previous);
                this.stopTrack();
            } else {
                await this.addTrack(this.previous);
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
        if (this._lastMusicMessageId) this.getText?.messages.fetch(this._lastMusicMessageId, { cache: false, force: true })?.then(x => x.delete()).catch(() => null);
        if (this._lastNowplayingMessageId) this.getText?.messages.fetch(this._lastNowplayingMessageId, { cache: false, force: true })?.then(x => x.delete()).catch(() => null);
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
        Object.defineProperty(this, "_timeout", {
            value: setTimeout(() => {
                this.getText?.send({ embeds: [createEmbed("info", `**${message}**`)] })
                    .then(async msg => (await this.getGuildDatabase)?.guildPlayer?.channelId ? setTimeout(() => msg.delete().catch(() => null), 5000) : undefined)
                    .catch(() => null);
                this.destroyPlayer();
            }, time).unref(),
            writable: true
        });
        return this._timeout!;
    }

    public async setTrackRepeat(active = true): Promise<this> {
        if (active) {
            Object.defineProperty(this, "trackRepeat", { value: true, enumerable: true, writable: true });
            Object.defineProperty(this, "queueRepeat", { value: false, enumerable: true, writable: true });
        } else {
            Object.defineProperty(this, "trackRepeat", { value: false, enumerable: true, writable: true });
            Object.defineProperty(this, "queueRepeat", { value: false, enumerable: true, writable: true });
        }
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this._lastMusicMessageId) {
            const getPlayerMessage = await this.getText?.messages.fetch(this._lastMusicMessageId).catch(() => null);
            if (getPlayerMessage) {
                const row = getPlayerMessage.components[0];
                const findRepeatButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "REPEAT") as MessageButton | undefined;
                if (findRepeatButton) {
                    if (active) {
                        findRepeatButton.setEmoji(":no_repeat:941342881845768282").setLabel("DISABLE");
                    } else {
                        findRepeatButton.setEmoji(":repeat:891234382097031168").setLabel("QUEUE");
                    }
                }
                await getPlayerMessage.edit({ components: [row] });
            }
        }
        return this;
    }

    public async setQueueRepeat(active = true): Promise<this> {
        if (active) {
            Object.defineProperty(this, "trackRepeat", { value: false, enumerable: true, writable: true });
            Object.defineProperty(this, "queueRepeat", { value: true, enumerable: true, writable: true });
        } else {
            Object.defineProperty(this, "trackRepeat", { value: false, enumerable: true, writable: true });
            Object.defineProperty(this, "queueRepeat", { value: false, enumerable: true, writable: true });
        }
        const getGuildDatabase = await this.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer?.channelId) setTimeout(() => this.shoukaku.updateGuildPlayerEmbed(this.getGuild), 500);
        if (this._lastMusicMessageId) {
            const getPlayerMessage = await this.getText?.messages.fetch(this._lastMusicMessageId).catch(() => null);
            if (getPlayerMessage) {
                const row = getPlayerMessage.components[0];
                const findRepeatButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "REPEAT") as MessageButton | undefined;
                if (findRepeatButton) {
                    if (active) {
                        findRepeatButton.setEmoji(":repeat_one:924117419960725534").setLabel("TRACK");
                    } else {
                        findRepeatButton.setEmoji(":repeat:891234382097031168").setLabel("QUEUE");
                    }
                }
                await getPlayerMessage.edit({ components: [row] });
            }
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
        if (this._lastMusicMessageId) {
            const getPlayerMessage = await this.getText?.messages.fetch(this._lastMusicMessageId).catch(() => null);
            if (getPlayerMessage) {
                const row = getPlayerMessage.components[0];
                const findPlayPauseButton = row.components.find(x => this.shoukaku.client.utils.encodeDecodeBase64String(x.customId ?? "", true).split("_")[1] === "PLAY-PAUSE") as MessageButton | undefined;
                if (findPlayPauseButton) {
                    if (paused) {
                        findPlayPauseButton.setEmoji(":play:941327026160283680").setLabel("PLAY");
                    } else {
                        findPlayPauseButton.setEmoji(":pause:941343422017581086").setLabel("PAUSE");
                    }
                }
                await getPlayerMessage.edit({ components: [row] });
            }
        }
        return this;
    }

    public setVolume(volume: number): this {
        this.player.setVolume(volume / 100);
        this.volume = volume;
        return this;
    }
}
