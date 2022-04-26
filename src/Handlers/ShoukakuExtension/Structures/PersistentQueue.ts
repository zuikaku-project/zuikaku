import { GuildSettings } from "@zuikaku/Handlers/Databases";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { Guild, TextBasedChannel, User } from "discord.js";
import { ShoukakuHandler } from "../ShoukakuHandler";
import { EmbedPlayer } from "./EmbedPlayer";
import { Track } from "./Track";

export class PersistentQueue {
    public _shoukaku!: ShoukakuHandler;
    public _client!: ZuikakuClient;
    public constructor(shoukaku: ShoukakuHandler) {
        Object.defineProperties(this, {
            _shoukaku: {
                value: shoukaku
            },
            _client: {
                value: shoukaku.client
            }
        });
    }

    public getGuildDatabase(
        guildId: string
    ): Promise<GuildSettings | undefined> {
        return this._client.database.entity.guilds.get(guildId);
    }

    public async assign(): Promise<void> {
        const allGuildDatabase = this._client.database.entity.guilds.cache.map(
            ({ guildId }) => ({ guildId })
        );
        for (const { guildId } of allGuildDatabase) {
            const guild = this._client.guilds.cache.get(guildId);
            if (!guild) return;
            const guildDatabase = await this.getGuildDatabase(guildId);
            await this.assignGuildDatabase(guild, guildDatabase);
        }
    }

    public async assignGuildDatabase(
        guild: Guild,
        guildDatabase: GuildSettings | undefined
    ): Promise<void> {
        if (guildDatabase?.guildPlayer?.channelId) {
            const channelGuildPlayer = this._client.channels.resolve(
                guildDatabase.guildPlayer.channelId
            );
            if (channelGuildPlayer) {
                const messageGuildPlayer = await (
                    channelGuildPlayer as TextBasedChannel
                ).messages
                    .fetch(guildDatabase.guildPlayer.messageId)
                    .catch(() => undefined);
                if (
                    messageGuildPlayer &&
                    messageGuildPlayer.author.id === this._client.user?.id
                ) {
                    const embedPlayer = new EmbedPlayer(this._client, guild);
                    await embedPlayer.fetch(!embedPlayer.channel);
                    await embedPlayer.update();
                }
            }
        }
        if (guildDatabase?.persistenceQueue?.textId) {
            const dispatcher = await this._shoukaku.handleJoin({
                guildId: guild.id,
                channelId: guildDatabase.persistenceQueue.voiceId,
                shardId: guild.shardId,
                deaf: true,
                textId: guildDatabase.persistenceQueue.textId,
                voiceId: guildDatabase.persistenceQueue.voiceId
            });
            if (guildDatabase.persistenceQueue.trackRepeat)
                await dispatcher.setTrackRepeat();
            if (guildDatabase.persistenceQueue.queueRepeat)
                await dispatcher.setQueueRepeat();
            if (guildDatabase.persistenceQueue.current) {
                const currentPersistent =
                    guildDatabase.persistenceQueue.current;
                // @ts-expect-error Not export User
                const requester = new User(
                    this._client,
                    currentPersistent._requester
                ) as User;
                guildDatabase.persistenceQueue.current = new Track(
                    currentPersistent
                );
                guildDatabase.persistenceQueue.current.setRequester(requester);
                guildDatabase.persistenceQueue.current.setShoukaku(
                    this._shoukaku
                );
                await dispatcher.queue.addTrack(
                    guildDatabase.persistenceQueue.current
                );
            }
            if (guildDatabase.persistenceQueue.tracks.length) {
                guildDatabase.persistenceQueue.tracks.map(track => {
                    // @ts-expect-error Not export User
                    const requester = new User(
                        this._client,
                        track._requester
                    ) as User;
                    track = new Track(track);
                    track.setRequester(requester);
                    track.setShoukaku(this._shoukaku);
                });
                await dispatcher.queue.addTrack(
                    guildDatabase.persistenceQueue.tracks
                );
            }
            await dispatcher.playTrack(guildDatabase.persistenceQueue.position);
            this._client.logger.info(
                "persistent queue",
                `Persistent Queue has been assigned for guild ${guild.name}`
            );
        }
    }
}
