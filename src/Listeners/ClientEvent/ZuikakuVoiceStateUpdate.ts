import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { VoiceState } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuVoiceStateUpdate",
    event: "voiceStateUpdate",
    emitter: "client"
})
export default class ZuikakuVoiceStateUpdate extends ZuikakuListener {
    public execute(oldState: VoiceState, newState: VoiceState): any {
        const dispatcher = this.client.shoukaku.dispatcher.get(newState.guild.id);
        if (!dispatcher) return;
        // handle disconnect
        if (
            oldState.member?.id === this.client.user?.id &&
            oldState.channelId === dispatcher.voiceId &&
            !newState.channelId
        ) {
            try {
                if (dispatcher._timeout) clearTimeout(dispatcher._timeout);
                if (!dispatcher.queueChecker._isStopped) dispatcher.destroyPlayer();
                return;
            } catch (e) {
                this.client.logger.error({
                    module: this.meta.name.toUpperCase(),
                    message: "Voice State Update Error",
                    error: e
                });
            }
        }
        if (
            newState.mute !== oldState.mute ||
            newState.deaf !== oldState.deaf
        ) return undefined;
        // handle bot moved
        if (
            newState.member?.id === this.client.user?.id &&
            oldState.channel?.id === dispatcher.voiceId &&
            newState.channel?.id !== dispatcher.voiceId &&
            newState.channel?.id !== undefined
        ) {
            if (newState.channel.type === "GUILD_STAGE_VOICE") {
                setTimeout(() => {
                    newState.guild.members.cache.get(this.client.user!.id)?.voice.setSuppressed(false).catch(() => null);
                }, 3000);
            }
            dispatcher.voiceId = newState.channel.id;
        }
    }
}
