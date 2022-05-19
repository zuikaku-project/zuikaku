import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import {
    ICommandComponent,
    IListenerComponent,
    IPluginComponent,
    IRouterComponent
} from "#zuikaku/types/core";

export function ZuikakuDecorator<
    P extends
        | ICommandComponent
        | IListenerComponent
        | IPluginComponent
        | IRouterComponent
>(meta: P["meta"]): any {
    return function decorate<
        T extends
            | ICommandComponent
            | IListenerComponent
            | IPluginComponent
            | IRouterComponent
    >(target: new (...args: any[]) => T): new (client: ZuikakuClient) => T {
        return new Proxy(target, {
            construct: (ctx, [client]): T => new ctx(client, meta)
        });
    };
}
