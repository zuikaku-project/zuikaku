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
        const queue = this.client.shoukaku.queue.get(player.connection.guildId);
        if (queue) {
            queue.playerMessage.lastPlayerMessage?.delete().catch(() => null);
        }
    }
}
