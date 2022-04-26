import {
    ICommandComponent,
    IListenerComponent,
    IPluginComponent
} from "@zuikaku/types/core";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";

export function ZuikakuDecorator<
    P extends ICommandComponent | IListenerComponent | IPluginComponent
>(meta: P["meta"]): any {
    return function decorate<T extends ICommandComponent>(
        target: new (...args: any[]) => T
    ): new (client: ZuikakuClient) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, meta)
        });
    };
}
