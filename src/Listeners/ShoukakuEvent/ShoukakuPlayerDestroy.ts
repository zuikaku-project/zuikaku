import { ZuikakuDecorator } from "@zuikaku/Handlers";
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
        const getGuildDatabase = await this.client.database.guilds.get(player.connection.guildId);
        if (getGuildDatabase?.guildPlayer) {
            await this.client.database.guilds.reset(player.connection.guildId, "persistenceQueue")
                .catch(() => null);
        } else {
            await this.client.database.guilds.drop(player.connection.guildId);
        }
        this.client.shoukaku.queue.delete(player.connection.guildId);
    }
}
