import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuError",
    event: "error",
    emitter: "shoukaku"
})
export default class ShoukakuError extends ZuikakuListener {
    public execute(name: string, error: any): void {
        this.client.logger.error({
            module: "LAVALINK",
            message: `Node ${name} Error Caught`,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            error: error.message
        });
    }
}
