import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import mongoose from "mongoose";

@ZuikakuDecorator<IListenerComponent>({
    name: "MongooseOpen",
    event: "open",
    emitter: "mongoose"
})
export default class MongooseOpen extends ZuikakuListener {
    public async execute(): Promise<void> {
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
    }
}
