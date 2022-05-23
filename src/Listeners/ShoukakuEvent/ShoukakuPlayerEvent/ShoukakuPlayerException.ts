import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Player } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "PlayerException",
    event: "playerException",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerException extends ZuikakuListener {
    public execute(player: Player): void {
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
