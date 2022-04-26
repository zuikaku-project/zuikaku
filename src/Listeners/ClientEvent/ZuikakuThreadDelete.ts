import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { TextChannel, ThreadChannel } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuThreadDelete",
    event: "threadDelete",
    emitter: "client"
})
export default class ZuikakuThreadDelete extends ZuikakuListener {
    public execute(channel: ThreadChannel): void {
        const dispatcher = this.client.shoukaku.dispatcher.get(
            channel.guild.id
        );
        if (!dispatcher) return;
        if (channel.archived || !channel.guild.channels.cache.get(channel.id))
            dispatcher.textId = (channel.parent as TextChannel).id;
    }
}
