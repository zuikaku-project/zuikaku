import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Player } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuDisconnect",
    event: "disconnect",
    emitter: "shoukaku"
})
export default class ShoukakuDisconnect extends ZuikakuListener {
    public execute(name: string, _: Player[], moved: boolean): void {
        this.client.logger.warn(
            "shoukaku",
            `Node ${name} Disconnected${moved ? ", Moved" : ""}`
        );
    }
}
