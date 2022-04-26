import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

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
        await this.client.database.dataSource
            .initialize()
            .catch((error: Error) => {
                const errorMessage =
                    error.stack?.replace(
                        new RegExp(`${__dirname}/`, "g"),
                        "./"
                    ) ?? error.message;
                this.client.logger.error(
                    "database",
                    "Error Caught: ",
                    errorMessage
                );
                this.client.logger.error(
                    "database",
                    "Couldn't connect to database. Exiting proces...",
                    errorMessage
                );
                process.exit(1);
            })
            .then(() => {
                const databaseEntity = Object.values(
                    this.client.database.entity
                );
                for (const database of databaseEntity) {
                    database._init(this.client.database.dataSource);
                }
                this.client.logger.info(
                    "database",
                    `${databaseEntity.length} Database has been initiated`
                );
            });
        await this.client.commands.load();
        await this.client.shoukaku.persistentQueue.assign();
        this.client.logger.info(
            "zuikaku",
            "五航戦、瑞鶴出撃よ！ - CarDiv 5, Zuikaku, launching!"
        );
    }
}
