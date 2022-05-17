import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { documentType, IGuildSchema } from "@zuikaku/types";
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
    ): Promise<documentType<IGuildSchema> | undefined> {
        return this._client.database.manager.guilds.get(guildId);
    }

    public async assign(): Promise<void> {
        const allGuildDatabase = this._client.database.manager.guilds.cache.map(
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
        guildDatabase: documentType<IGuildSchema> | undefined
    ): Promise<void> {
        if (guildDatabase?.guildPlayer.channelId) {
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
        if (guildDatabase?.persistentQueue.textId) {
            if (
                guildDatabase.persistentQueue.playerMessageId !==
                guildDatabase.guildPlayer.messageId
            ) {
                const channelPersistence = this._client.channels.resolve(
                    guildDatabase.persistentQueue.textId
                );
                if (channelPersistence) {
                    const messagePersistent = await (
                        channelPersistence as TextBasedChannel
                    ).messages
                        .fetch(guildDatabase.persistentQueue.playerMessageId!)
                        .catch(() => undefined);
                    if (messagePersistent) {
                        await messagePersistent.delete().catch(() => null);
                    }
                }
            }
            const dispatcher = await this._shoukaku.handleJoin({
                guildId: guild.id,
                channelId: guildDatabase.persistentQueue.voiceId,
                shardId: guild.shardId,
                deaf: true,
                textId: guildDatabase.persistentQueue.textId,
                voiceId: guildDatabase.persistentQueue.voiceId
            });
            if (guildDatabase.persistentQueue.trackRepeat)
                await dispatcher.setTrackRepeat();
            if (guildDatabase.persistentQueue.queueRepeat)
                await dispatcher.setQueueRepeat();
            if (guildDatabase.persistentQueue.current) {
                const currentPersistent = guildDatabase.persistentQueue.current;
                // @ts-expect-error Not export User
                const requester = new User(
                    this._client,
                    currentPersistent._requester
                ) as User;
                guildDatabase.persistentQueue.current = new Track(
                    currentPersistent
                );
                guildDatabase.persistentQueue.current.setRequester(requester);
                guildDatabase.persistentQueue.current.setShoukaku(
                    this._shoukaku
                );
                await dispatcher.queue.addTrack(
                    guildDatabase.persistentQueue.current
                );
            }
            if (guildDatabase.persistentQueue.tracks.length) {
                guildDatabase.persistentQueue.tracks.map(track => {
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
                    guildDatabase.persistentQueue.tracks
                );
            }
            await dispatcher.playTrack(guildDatabase.persistentQueue.position);
            this._client.logger.info(
                "persistent queue",
                `Persistent Queue has been assigned for guild ${guild.name}`
            );
        }
    }
}
