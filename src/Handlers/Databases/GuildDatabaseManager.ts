import { documentType, IGuildSchema } from "@zuikaku/types";
import { Collection } from "discord.js";
import { Connection } from "mongoose";
import { GuildSchema } from "./Schema";

export class GuildDatabaseManager {
    public connection!: Connection;
    public readonly cache = new Collection<
        string,
        documentType<IGuildSchema>
    >();

    public async init(connection: Connection): Promise<void> {
        this.connection = connection;
        connection.model<IGuildSchema>("Guilds", GuildSchema);
        await this.list();
    }

    public async list(): Promise<documentType<IGuildSchema>[]> {
        const data = await this.connection.model<IGuildSchema>("Guilds").find();
        data.forEach(Guild => this.cache.set(Guild.guildId, Guild));
        return data;
    }

    public async get(
        guildId: string
    ): Promise<documentType<IGuildSchema> | undefined> {
        const cache = this.cache.get(guildId);
        if (cache) {
            return cache;
        }
        const database = await this.connection
            .model<IGuildSchema>("Guilds")
            .findOne({
                where: { guildId }
            });
        if (!database) {
            return undefined;
        }
        return database;
    }

    public async set(
        guildId: string,
        key: keyof IGuildSchema,
        value: any
    ): Promise<documentType<IGuildSchema>> {
        const database = this.cache.get(guildId) ?? (await this.get(guildId));
        if (!database) {
            const newGuildDatabase = await this.connection
                .model<IGuildSchema>("Guilds")
                .create({
                    guildId,
                    [key]: value
                });
            this.cache.set(guildId, newGuildDatabase);
            return newGuildDatabase;
        }
        const findAndUpdateDatabase = await this.connection
            .model<IGuildSchema>("Guilds")
            .findOneAndUpdate(
                { guildId },
                { [key]: value },
                { returnDocument: "after" }
            );
        this.cache.set(guildId, findAndUpdateDatabase!);
        return findAndUpdateDatabase!;
    }

    public async drop(
        guildId: string
    ): Promise<documentType<IGuildSchema> | null> {
        this.cache.delete(guildId);
        return this.connection
            .model<IGuildSchema>("Guilds")
            .findOneAndDelete({ guildId });
    }

    public async reset(
        guildId: string,
        key: keyof IGuildSchema
    ): Promise<documentType<IGuildSchema>> {
        let value = {};
        value =
            key === "persistentQueue"
                ? {
                      textId: null,
                      voiceId: null,
                      playerMessageId: null,
                      current: null,
                      tracks: [],
                      previous: null,
                      queueRepeat: false,
                      trackRepeat: false,
                      volume: 0,
                      position: 0
                  }
                : {
                      channelId: null,
                      messageId: null
                  };
        return this.set(guildId, key, value);
    }
}
