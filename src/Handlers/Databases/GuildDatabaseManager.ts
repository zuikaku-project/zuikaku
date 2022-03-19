import { Collection } from "discord.js";
import { DataSource, DeleteWriteOpResultObject, MongoRepository } from "typeorm";
import { GuildSettings } from "./Entities/GuildSettings";

export class GuildDatabaseManager {
    public collection!: MongoRepository<GuildSettings>;
    public cache: Collection<string, GuildSettings> = new Collection();

    public _init(dataSource: DataSource): void {
        this.collection = dataSource.getMongoRepository(GuildSettings);
        void this.list()
            .then(database => database.map(guildSettings => this.cache.set(guildSettings.guildId, guildSettings)));
    }

    public async get(guildId: string): Promise<GuildSettings | undefined> {
        const cache = this.cache.get(guildId);
        if (cache) {
            return cache;
        }
        const database = await this.collection.findOne({ where: { guildId } });
        if (!database) {
            return undefined;
        }
        return database;
    }

    public async set(guildId: string, key: keyof GuildSettings, value: any): Promise<GuildSettings> {
        let database = this.cache.get(guildId) ?? await this.get(guildId);
        if (!database) {
            const newGuildDatabase = this.collection.create({ guildId });
            if (!this.cache.has(guildId)) {
                this.cache.set(guildId, newGuildDatabase);
            }
            // @ts-expect-error - This is a bug in the typescript compiler
            await this.collection.save(newGuildDatabase);
            database = newGuildDatabase;
        }
        database[key] = value;
        await this.collection.save(database);
        if (this.cache.has(guildId)) this.cache.set(guildId, database);
        return database;
    }

    public async drop(guildId: string): Promise<DeleteWriteOpResultObject> {
        this.cache.delete(guildId);
        return this.collection.deleteOne({ guildId });
    }

    public async list(): Promise<GuildSettings[]> {
        return this.collection.find({});
    }

    public async reset(guildId: string, key: keyof GuildSettings): Promise<GuildSettings> {
        let value = {};
        value = key === "persistenceQueue"
            ? {
                textChannelId: null,
                voiceChannelId: null,
                current: null,
                tracks: [],
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
