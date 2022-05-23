import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import { documentType, IGuildSchema } from "#zuikaku/types";
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
            ({ guildId, guildPlayer, persistentQueue }) => ({
                guildId,
                guildPlayer,
                persistentQueue
            })
        );
        for (const {
            guildId,
            guildPlayer,
            persistentQueue
        } of allGuildDatabase) {
            const guild = this._client.guilds.cache.get(guildId);
            if (!guild) continue;

            const isValidPersistent =
                Boolean(persistentQueue.textId) &&
                (await guild.channels
                    .fetch(persistentQueue.voiceId)
                    .then(x => Boolean(x?.isVoice()))
                    .catch(() => false));
            const isValidGuildPlayer =
                Boolean(guildPlayer.channelId) &&
                Boolean(guildPlayer.messageId);

            if (isValidGuildPlayer) {
                await this.assignGuildPlayer(guild, guildPlayer);
            }
            if (isValidPersistent) {
                await this.assignPersistentQueue(
                    guild,
                    guildPlayer,
                    persistentQueue
                );
            }
        }
    }

    private async assignGuildPlayer(
        guild: Guild,
        guildPlayer: IGuildSchema["guildPlayer"]
    ): Promise<void> {
        const channelGuildPlayer = this._client.channels.resolve(
            guildPlayer.channelId
        );
        if (channelGuildPlayer) {
            const messageGuildPlayer = await (
                channelGuildPlayer as TextBasedChannel
            ).messages
                .fetch(guildPlayer.messageId)
                .catch(() => null);
            if (messageGuildPlayer?.author.id === this._client.user?.id) {
                const embedPlayer = new EmbedPlayer(this._client, guild);
                await embedPlayer.fetch(!embedPlayer.channel);
                await embedPlayer.update();
            }
        }
    }

    private async assignPersistentQueue(
        guild: Guild,
        guildPlayer: IGuildSchema["guildPlayer"],
        persistentQueue: IGuildSchema["persistentQueue"]
    ): Promise<void> {
        if (
            persistentQueue.playerMessageId &&
            persistentQueue.playerMessageId !== guildPlayer.messageId
        ) {
            const channelPersistence = this._client.channels.resolve(
                persistentQueue.textId
            );
            if (channelPersistence) {
                const messagePersistent = await (
                    channelPersistence as TextBasedChannel
                ).messages
                    .fetch(persistentQueue.playerMessageId)
                    .catch(() => null);
                await messagePersistent?.delete().catch(() => null);
            }
        }
        const dispatcher = await this._shoukaku.handleJoin({
            guildId: guild.id,
            channelId: persistentQueue.voiceId,
            shardId: guild.shardId,
            deaf: true,
            textId: persistentQueue.textId,
            voiceId: persistentQueue.voiceId
        });
        if (persistentQueue.trackRepeat) await dispatcher.setTrackRepeat();
        if (persistentQueue.queueRepeat) await dispatcher.setQueueRepeat();
        if (persistentQueue.current) {
            const currentPersistent = persistentQueue.current;
            // @ts-expect-error Not export User
            const requester = new User(
                this._client,
                currentPersistent._requester
            ) as User;
            persistentQueue.current = new Track(currentPersistent);
            persistentQueue.current.setRequester(requester);
            persistentQueue.current.setShoukaku(this._shoukaku);
            await dispatcher.queue.addTrack(persistentQueue.current);
        }
        if (persistentQueue.tracks.length) {
            persistentQueue.tracks.map(track => {
                // @ts-expect-error Not export User
                const requester = new User(
                    this._client,
                    track._requester
                ) as User;
                track = new Track(track);
                track.setRequester(requester);
                track.setShoukaku(this._shoukaku);
            });
            await dispatcher.queue.addTrack(persistentQueue.tracks);
        }
        await dispatcher.playTrack(persistentQueue.position);
        this._client.logger.info(
            "persistent queue",
            `Persistent Queue has been assigned for guild ${guild.name}`
        );
    }
}
