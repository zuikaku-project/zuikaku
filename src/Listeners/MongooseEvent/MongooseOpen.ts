import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";

@ZuikakuDecorator<IListenerComponent>({
    name: "MongooseOpen",
    event: "open",
    emitter: "mongoose"
})
export default class MongooseOpen extends ZuikakuListener {
    public execute(): void {
        this.client.logger.info("mongo.db", `Database has been connected.`);
    }
}
