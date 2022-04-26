import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuError",
    event: "error",
    emitter: "shoukaku"
})
export default class ShoukakuError extends ZuikakuListener {
    public execute(name: string, error: Error): void {
        const errorMessage =
            error.stack?.replace(new RegExp(`${__dirname}/`, "g"), "./") ??
            error.message;
        this.client.logger.error(
            "shoukaku",
            `Node ${name} Error Caught: `,
            errorMessage
        );
    }
}
