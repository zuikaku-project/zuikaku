import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { ShoukakuPlayer } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "ShoukakuPlayerDestroy",
    event: "playerDestroy",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerDestroy extends ZuikakuListener {
    public async execute(_: string, player: ShoukakuPlayer): Promise<void> {
        const getGuildDatabase = await this.client.database.manager.guilds.get(
            player.connection.guildId
        );
        if (getGuildDatabase?.guildPlayer?.channelId) {
            await this.client.database.manager.guilds
                .reset(player.connection.guildId, "persistentQueue")
                .catch(() => null);
        } else {
            await this.client.database.manager.guilds
                .drop(player.connection.guildId)
                .catch(() => null);
        }
        this.client.shoukaku.dispatcher.delete(player.connection.guildId);
    }
}
