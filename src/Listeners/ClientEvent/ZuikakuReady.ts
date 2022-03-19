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
        await this.client.apis.dbl.postStats({
            serverCount: this.client.guilds.cache.size
        }).catch(() => null);
        await this.client.database.dataSource
            .initialize()
            .catch((error: Error) => {
                this.client.logger.error({
                    module: "DATABASE",
                    message: "caught database error",
                    error
                });
                this.client.logger.info({
                    module: "DATABASE",
                    message: "could not connect to database, exiting process"
                });
                process.exit(1);
            })
            .then(() => {
                const databaseEntity = Object.values(this.client.database.entity);
                for (const database of databaseEntity) {
                    database._init(this.client.database.dataSource);
                }
                this.client.logger.log({
                    module: "DATABASE",
                    message: `${databaseEntity.length} Database has been initiated`
                });
                this.client.shoukaku.assignPersistenceQueue();
            });
        await this.client.commands.load();
        this.client.logger.ready({
            module: this.meta.name.toUpperCase(),
            message: "五航戦、瑞鶴出撃よ！ - CarDiv 5, Zuikaku, launching!"
        });
    }
}
