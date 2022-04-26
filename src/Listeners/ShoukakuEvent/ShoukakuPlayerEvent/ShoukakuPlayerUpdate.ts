import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { PlayerUpdate, ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuPlayerUpdate",
    event: "playerUpdate",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerUpdate extends ZuikakuListener {
    public async execute(
        player: ShoukakuPlayer,
        payload: PlayerUpdate
    ): Promise<void> {
        const dispatcher = this.client.shoukaku.dispatcher.get(
            player.connection.guildId
        );
        if (dispatcher) {
            await this.client.database.entity.guilds.set(
                dispatcher.player.connection.guildId,
                "persistenceQueue",
                JSON.parse(
                    JSON.stringify({
                        guildId: payload.guildId,
                        textId: dispatcher.textId,
                        voiceId: dispatcher.voiceId,
                        tracks: dispatcher.queue.tracks.filter(
                            x => x.track.length
                        ),
                        current: dispatcher.queue.current,
                        previous: dispatcher.queue.previous,
                        queueRepeat: dispatcher.queueRepeat,
                        trackRepeat: dispatcher.trackRepeat,
                        volume: dispatcher.volume,
                        position: payload.state.position ?? 0
                    })
                )
            );
        }
    }
}
