import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuClose",
    event: "close",
    emitter: "shoukaku"
})
export default class ShoukakuClose extends ZuikakuListener {
    public execute(name: string, code: number, reason: string): void {
        this.client.logger.warn({
            module: "LAVALINK",
            message: `Node ${name} Closed, Code: ${code}, Reason: ${["string", "boolean", "number"].includes(typeof reason)
                ? reason
                : "No reason"}`,
            warn: reason
        });
    }
}