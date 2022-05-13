import { documentType, IUserSchema } from "@zuikaku/types";
import { Collection } from "discord.js";
import { Connection } from "mongoose";
import { UserSchema } from "./Schema";

export class UserDatabaseManager {
    public connection!: Connection;
    public readonly cache = new Collection<
        string,
        documentType<IUserSchema> | undefined
    >();

    public async init(connection: Connection): Promise<void> {
        this.connection = connection;
        connection.model<IUserSchema>("Users", UserSchema);
        await this.list();
    }

    public async list(): Promise<documentType<IUserSchema>[]> {
        const data = await this.connection.model<IUserSchema>("Users").find();
        data.forEach(Guild => this.cache.set(Guild.userId, Guild));
        return data;
    }

    public async get(
        userId: string
    ): Promise<documentType<IUserSchema> | undefined> {
        const cache = this.cache.get(userId);
        if (cache) {
            return cache;
        }
        const database = await this.connection
            .model<IUserSchema>("Users")
            .findOne({ userId });
        if (!database) {
            return undefined;
        }
        return database;
    }

    public async set(
        userId: string,
        key: keyof IUserSchema,
        value: any
    ): Promise<documentType<IUserSchema>> {
        const database = this.cache.get(userId) ?? (await this.get(userId));
        if (!database) {
            const newUserDatabase = await this.connection
                .model<IUserSchema>("Users")
                .create({
                    userId,
                    [key]: value
                });
            this.cache.set(userId, newUserDatabase);
            return newUserDatabase;
        }
        const findAndUpdateDatabase = await this.connection
            .model<IUserSchema>("Users")
            .findOneAndUpdate(
                { userId },
                { [key]: value },
                { returnDocument: "after" }
            );
        this.cache.set(userId, findAndUpdateDatabase!);
        return findAndUpdateDatabase!;
    }

    public async drop(
        userId: string
    ): Promise<documentType<IUserSchema> | null> {
        this.cache.delete(userId);
        return this.connection
            .model<IUserSchema>("Users")
            .findOneAndDelete({ userId });
    }

    public async reset(
        userId: string,
        key: keyof IUserSchema
    ): Promise<documentType<IUserSchema>> {
        let value = {};
        if (key === "playlists") value = [];
        return this.set(userId, key, value);
    }
}
