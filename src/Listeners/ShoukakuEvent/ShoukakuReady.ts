import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuReady",
    event: "ready",
    emitter: "shoukaku"
})
export default class ShoukakuReady extends ZuikakuListener {
    public execute(name: string, reconnect: boolean): void {
        this.client.logger.info(
            "shoukaku",
            `Node ${name}: ${reconnect ? "Reconnected" : "Connected"}`
        );
    }
}
