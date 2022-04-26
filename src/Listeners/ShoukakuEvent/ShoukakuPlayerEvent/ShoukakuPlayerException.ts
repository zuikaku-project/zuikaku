import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuPlayerException",
    event: "playerException",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerException extends ZuikakuListener {
    public execute(player: ShoukakuPlayer): void {
        const dispatcher = this.client.shoukaku.dispatcher.get(
            player.connection.guildId
        );
        if (dispatcher) {
            dispatcher.queueMessage.lastPlayerMessage
                ?.delete()
                .catch(() => null);
        }
    }
}
