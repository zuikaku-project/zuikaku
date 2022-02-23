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
        const queue = this.client.shoukaku.queue.get(channel.guild.id);
        if (!queue) return;
        if (
            channel.archived ||
            !channel.guild.channels.cache.get(channel.id)
        ) queue.textId = (channel.parent as TextChannel).id;
    }
}
