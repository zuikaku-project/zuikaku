import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Player } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "PlayerTrackEnd",
    event: "playerTrackEnd",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerTrackEnd extends ZuikakuListener {
    public async execute(player: Player): Promise<void> {
        const dispatcher = this.client.shoukaku.dispatcher.get(
            player.connection.guildId
        );
        if (dispatcher) {
            if (dispatcher.queueMessage.lastPlayerMessage) {
                dispatcher.queueMessage.lastPlayerMessage
                    .delete()
                    .catch(() => null);
                dispatcher.queueMessage.lastPlayerMessage = null;
            }
            if (dispatcher.trackRepeat)
                dispatcher.queue.tracks.unshift(dispatcher.queue.current!);
            if (dispatcher.queueRepeat)
                await dispatcher.queue.addTrack(dispatcher.queue.current!);
            if (
                !dispatcher.queueChecker._isFromPrevious &&
                !dispatcher.trackRepeat
            ) {
                dispatcher.queue.previous = dispatcher.queue.current!;
            }
            dispatcher.queue.current = null;
            if (dispatcher.queue.tracks.length === 0) {
                const getGuildDatabase = await dispatcher.getGuildDatabase;
                if (getGuildDatabase?.guildPlayer.channelId) {
                    setTimeout(() => dispatcher.getEmbedPlayer?.update(), 500);
                }
                dispatcher.setTimeout(
                    3 * 6e4,
                    "Inactive player for 3 minutes. The player has been destroyed"
                );
                return;
            }
            dispatcher.queue.current = dispatcher.queue.tracks.shift()!;
            await dispatcher.playTrack();
        }
    }
}
