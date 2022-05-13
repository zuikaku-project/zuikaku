import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { IRouterComponent } from "@zuikaku/types";
import cors from "cors";
import { Collection } from "discord.js";
import express from "express";
import { resolve } from "node:path";

export class RouterHandler extends Collection<string, IRouterComponent> {
    public readonly app = express();
    public constructor(
        private readonly client: ZuikakuClient,
        public readonly path: string
    ) {
        super();
    }

    public load(): void {
        this.app.set("trust proxy", true);
        this.app.set("json spaces", 2);
        this.app.use(cors());
        try {
            const routerFiles = this.client.utils.readdirRecursive(this.path);
            this.client.logger.info(
                "router handler",
                `Loading ${routerFiles.length} router(s)...`
            );
            routerFiles.forEach(async routeFile => {
                const router = await this.client.utils.import<IRouterComponent>(
                    resolve(routeFile),
                    this.client
                );
                if (router === undefined) {
                    this.client.logger.error(
                        "router handler",
                        `File ${routeFile} is not valid router file`
                    );
                    return;
                }
                if (this.has(router.meta.name)) {
                    this.client.logger.warn(
                        "router handler",
                        `Duplicate router ${router.meta.name}`
                    );
                    return;
                }
                this.set(router.meta.name, router);
                if (router.meta.callback?.length) {
                    this.app[router.meta.method](
                        router.meta.path,
                        ...router.meta.callback,
                        router.execute.bind(router)
                    );
                } else {
                    this.app[router.meta.method](
                        router.meta.path,
                        router.execute.bind(router)
                    );
                }
            });
        } catch (err) {
            this.client.logger.error(
                "router handler",
                "Router Handler Err:",
                err
            );
        } finally {
            this.client.logger.info("router handler", `Done Loaded Router`);
            this.app.listen(
                process.env.SERVER_PORT ?? this.client.config.api.port,
                () =>
                    this.client.logger.info(
                        "router handler",
                        `Server is listening on port ${
                            process.env.SERVER_PORT ??
                            this.client.config.api.port
                        }`
                    )
            );
        }
    }
}
