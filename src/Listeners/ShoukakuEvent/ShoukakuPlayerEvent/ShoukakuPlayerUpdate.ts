import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Utils } from "#zuikaku/Utils";
import { PlayerUpdate, Player } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "PlayerUpdate",
    event: "playerUpdate",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerUpdate extends ZuikakuListener {
    public async execute(player: Player, payload: PlayerUpdate): Promise<void> {
        const dispatcher = this.client.shoukaku.dispatcher.get(
            player.connection.guildId
        );
        if (dispatcher) {
            await this.client.database.manager.guilds.set(
                dispatcher.player.connection.guildId,
                "persistentQueue",
                Utils.structuredClone({
                    guildId: payload.guildId,
                    textId: dispatcher.textId,
                    voiceId: dispatcher.voiceId,
                    playerMessageId:
                        dispatcher.queueMessage.lastPlayerMessage?.id,
                    tracks: dispatcher.queue.tracks.filter(x => x.track.length),
                    current: dispatcher.queue.current,
                    previous: dispatcher.queue.previous,
                    queueRepeat: dispatcher.queueRepeat,
                    trackRepeat: dispatcher.trackRepeat,
                    volume: dispatcher.volume,
                    position: payload.state.position ?? 0
                })
            );
        }
    }
}
