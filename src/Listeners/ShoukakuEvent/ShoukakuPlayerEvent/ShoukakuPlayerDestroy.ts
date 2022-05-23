import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { Player } from "shoukaku";

@ZuikakuDecorator<IListenerComponent>({
    name: "PlayerDestroy",
    event: "playerDestroy",
    emitter: "shoukaku"
})
export default class ShoukakuPlayerDestroy extends ZuikakuListener {
    public async execute(_: string, player: Player): Promise<void> {
        const getGuildDatabase = await this.client.database.manager.guilds.get(
            player.connection.guildId
        );
        if (getGuildDatabase?.guildPlayer.channelId) {
            await this.client.database.manager.guilds
                .reset(player.connection.guildId, "persistentQueue")
                .catch(console.log);
        } else {
            await this.client.database.manager.guilds
                .drop(player.connection.guildId)
                .catch(console.log);
        }
        this.client.shoukaku.dispatcher.delete(player.connection.guildId);
    }
}
