import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuError",
    event: "error",
    emitter: "shoukaku"
})
export default class ShoukakuError extends ZuikakuListener {
    public execute(name: string, error: Error): void {
        this.client.logger.error(
            "shoukaku",
            `Node ${name} Error Caught: `,
            error.stack ?? error.message
        );
    }
}
