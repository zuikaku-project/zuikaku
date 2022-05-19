import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Utils } from "#zuikaku/Utils";
import mongoose from "mongoose";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuReady",
    event: "ready",
    emitter: "client"
})
export default class ZuikakuReady extends ZuikakuListener {
    public async execute(): Promise<void> {
        await this.client.apis.dbl
            .postStats({
                serverCount: this.client.guilds.cache.size
            })
            .catch(() => null);
        await mongoose.connect(this.client.config.mongodb.url, {
            dbName: this.client.config.devMode
                ? this.client.config.mongodb.dbName.development
                : this.client.config.mongodb.dbName.production
        });
        await Utils.delay(5000);
        const databaseManager = Object.values(this.client.database.manager);
        await Promise.all(
            databaseManager.map(async manager => {
                await manager.init(mongoose.connection);
            })
        );
        this.client.logger.info(
            "mongo.db",
            `${databaseManager.length} Database Manager has been initiated`
        );
        await this.client.shoukaku.persistentQueue.assign();
        await this.client.command.load();
        this.client.router.load();
        this.client.logger.info(
            "zuikaku",
            "五航戦、瑞鶴出撃よ！ - CarDiv 5, Zuikaku, launching!"
        );
    }
}
