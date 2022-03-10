import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { resolve } from "node:path";
import { createConnection } from "typeorm";

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
        await createConnection({
            database: "database",
            type: "mongodb",
            url: "mongodb+srv://12345:qwerty111@database.ewzkt.mongodb.net/database",
            useUnifiedTopology: true,
            ssl: true,
            sslValidate: true,
            useNewUrlParser: true,
            entities: [
                `${resolve(__dirname, "../../Handlers/Databases/Entities")}/**/*.js`
            ]
        }).catch((error: Error) => {
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
        }).then(() => {
            for (const database of Object.values(this.client.database)) database._init();
            this.client.database.guilds._init();
            this.client.logger.log({
                module: "DATABASE",
                message: `${Object.values(this.client.database).length} Database has been initiated`
            });
            if (!this.client.config.devMode) this.client.shoukaku.assignPersistenceQueue();
        });
        await this.client.commands.load();
        this.client.logger.ready({
            module: this.meta.name.toUpperCase(),
            message: "五航戦、瑞鶴出撃よ！ - CarDiv 5, Zuikaku, launching!"
        });
    }
}
