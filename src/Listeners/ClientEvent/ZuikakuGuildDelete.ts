import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { Guild, WebhookClient } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuGuildDelete",
    event: "guildDelete",
    emitter: "client"
})
export default class ZuikakuGuildDelete extends ZuikakuListener {
    public async execute(guild: Guild): Promise<void> {
        if (!guild.available) return undefined;
        await this.client.database.manager.guilds.drop(guild.id).then(() => {
            this.client.logger.info(
                "database",
                `Remove Database Guild ${guild.name}`
            );
            this.client.shoukaku.embedPlayers.delete(guild.id);
        });
        const sname = guild.name;
        const membert = guild.members.cache.size;
        const memberbot = guild.members.cache.filter(x => x.user.bot).size;
        const memberuser = guild.members.cache.filter(x => !x.user.bot).size;
        const owner = guild.members.cache.get(guild.ownerId)?.user;

        const e = createEmbed("error")
            .setAuthor({ name: "I Removed one Server" })
            .setDescription(
                "**Server Information\n" +
                    "```asciidoc\n" +
                    `Server Name   :: ${sname} | ${guild.id}\n` +
                    `Server Owner  :: ${
                        owner ? `${owner.tag} | ${owner.id}` : "Unknown Owner"
                    } \n` +
                    `Member Count  :: ${membert} Member\n` +
                    `              :: ${memberuser} User\n` +
                    `              :: ${memberbot} Bot\n` +
                    "```**"
            );
        const webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/875557228495659038/Fbfz3LmnXm8etVl4uOwXKdxRxJgqMane10byBydp8-vMgXAKiJYaB-OQSrbal3SMqBiK"
        });
        await webhook.send({ embeds: [e] });
    }
}
