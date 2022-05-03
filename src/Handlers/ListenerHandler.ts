/* eslint-disable @typescript-eslint/no-unsafe-argument */
import Collection from "@discordjs/collection";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { IListenerComponent } from "@zuikaku/types";
import { resolve } from "node:path";

export class ListenerHandler extends Collection<string, IListenerComponent> {
    public constructor(public client: ZuikakuClient, public path: string) {
        super();
    }

    public async load(): Promise<void> {
        try {
            const listeners = this.client.utils.readdirRecursive(this.path);
            this.client.logger.info(
                "listener handler",
                `Loading ${listeners.length} listeners...`
            );
            for (const files of listeners) {
                const event =
                    await this.client.utils.import<IListenerComponent>(
                        resolve(files),
                        this.client
                    );
                if (event === undefined) {
                    console.log(event, files);
                    return;
                }
                this.set(event.meta.name, event);
                const path = files;
                Object.freeze(Object.assign(event.meta, { path }));
                switch (event.meta.emitter) {
                    case "client":
                        this.client.addListener(event.meta.event, (...args) =>
                            event.execute(...args)
                        );
                        break;

                    case "shoukaku":
                        this.client.shoukaku.addListener(
                            event.meta.event,
                            (...args: any) => event.execute(...args)
                        );
                        break;
                }
            }
        } catch (err) {
            this.client.logger.error(
                "listener handler",
                "Listener Handler Err: ",
                err
            );
        } finally {
            this.client.logger.info("listener handler", `Done Loaded Listener`);
        }
    }

    public async reloadAll(): Promise<void> {
        this.clear();
        const listeners = this.client.utils.readdirRecursive(this.path);
        for (const files of listeners) {
            const event = await this.client.utils.import<IListenerComponent>(
                resolve(files),
                this.client
            );
            if (event === undefined) {
                console.log(event, files);
                return;
            }
            this.set(event.meta.name, event);
            const path = files;
            Object.freeze(Object.assign(event.meta, { path }));
        }
    }
}
