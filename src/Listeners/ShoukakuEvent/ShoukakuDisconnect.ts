import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuDisconnect",
    event: "disconnect",
    emitter: "shoukaku"
})
export default class ShoukakuDisconnect extends ZuikakuListener {
    public execute(name: string, _: ShoukakuPlayer[], moved: boolean): void {
        this.client.logger.warn(
            "shoukaku",
            `Node ${name} Disconnected${moved ? ", Moved" : ""}`
        );
    }
}
