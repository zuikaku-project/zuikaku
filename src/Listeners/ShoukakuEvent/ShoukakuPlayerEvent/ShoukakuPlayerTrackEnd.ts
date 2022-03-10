import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuPlayerTrackEnd",
    event: "playerTrackEnd",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerTrackEnd extends ZuikakuListener {
    public async execute(player: ShoukakuPlayer): Promise<void> {
        const queue = this.client.shoukaku.queue.get(player.connection.guildId);
        if (queue) {
            if (queue.playerMessage.lastPlayerMessage) {
                queue.playerMessage.lastPlayerMessage.delete().catch(() => null);
                queue.playerMessage.lastPlayerMessage = null;
            }
            if (queue.trackRepeat) queue.tracks.unshift(queue.current!);
            if (queue.queueRepeat) await queue.addTrack(queue.current!);
            if (!queue._isFromPrev) {
                queue.previous = queue.current!;
            }
            console.log(queue.previous);
            queue.current = null;
            if (queue.tracks.length === 0) {
                const getGuildDatabase = await queue.getGuildDatabase;
                if (getGuildDatabase?.guildPlayer?.channelId) {
                    setTimeout(() => queue.shoukaku.updateGuildPlayerEmbed(queue.getGuild), 500);
                }
                queue.setTimeout(3 * 6e4, "Inactive player for 3 minutes. The player has been destroyed");
                return;
            }
            queue.current = queue.tracks.shift()!;
            await queue.playTrack();
        }
    }
}
