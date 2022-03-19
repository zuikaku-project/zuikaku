import { Collection } from "discord.js";
import { DeleteWriteOpResultObject, getMongoRepository, MongoRepository } from "typeorm";
import { UserSettings } from "./Entities/UserSettings";

export class UserDatabaseManager {
    public collection!: MongoRepository<UserSettings>;
    public cache: Collection<string, UserSettings> = new Collection();

    public _init(): void {
        this.collection = getMongoRepository(UserSettings);
        void this.list()
            .then(database => database.map(userSettings => this.cache.set(userSettings.userId, userSettings)));
    }

    public async get(userId: string): Promise<UserSettings | undefined> {
        const cache = this.cache.get(userId);
        if (cache) {
            return cache;
        }
        const database = await this.collection.findOne({ where: { userId } });
        if (!database) {
            return undefined;
        }
        return database;
    }

    public async set(userId: string, key: keyof UserSettings, value: any): Promise<UserSettings> {
        let database = this.cache.get(userId) ?? await this.get(userId);
        if (!database) {
            const newUserDatabase = this.collection.create({ userId });
            if (!this.cache.has(userId)) {
                this.cache.set(userId, newUserDatabase);
            }
            await this.collection.save(newUserDatabase);
            database = newUserDatabase;
        }
        database[key] = value;
        await this.collection.save(database);
        if (this.cache.has(userId)) {
            this.cache.set(userId, database);
        }
        return database;
    }

    public async drop(userId: string): Promise<DeleteWriteOpResultObject> {
        this.cache.delete(userId);
        return this.collection.deleteOne({ userId });
    }

    public async list(): Promise<UserSettings[]> {
        return this.collection.find({});
    }

    public async reset(userId: string, key: keyof UserSettings): Promise<UserSettings> {
        let value = {};
        if (key === "playlists") value = [];
        return this.set(userId, key, value);
    }
}
