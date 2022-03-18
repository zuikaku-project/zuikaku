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
    public async execute(player: ShoukakuPlayer, payload: PlayerUpdate): Promise<void> {
        const queue = this.client.shoukaku.queue.get(player.connection.guildId);
        if (queue) {
            await this.client.database.guilds.set(
                queue.player.connection.guildId,
                "persistenceQueue",
                JSON.parse(
                    JSON.stringify({
                        guildId: payload.guildId,
                        textId: queue.textId,
                        voiceId: queue.voiceId,
                        tracks: queue.tracks.filter(x => x.track.length),
                        current: queue.current,
                        previous: queue.previous,
                        queueRepeat: queue.queueRepeat,
                        trackRepeat: queue.trackRepeat,
                        volume: queue.volume,
                        position: payload.state.position ?? 0
                    })
                )
            );
        }
    }
}
