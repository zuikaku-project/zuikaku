import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { Guild, WebhookClient } from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuGuildCreate",
    event: "guildCreate",
    emitter: "client"
})
export default class ZuikakuGuildCreate extends ZuikakuListener {
    public async execute(guild: Guild): Promise<void> {
        if (!guild.available) return undefined;
        this.client.logger.info({ module: "DATABASE", message: `New Guild ${guild.name}, database has been assigned` });
        const sname = guild.name;
        const membert = guild.members.cache.size;
        const memberbot = guild.members.cache.filter(x => x.user.bot).size;
        const memberuser = guild.members.cache.filter(x => !x.user.bot).size;
        const owner = guild.members.cache.get(guild.ownerId)?.user;
        const e = createEmbed("info")
            .setAuthor({ name: "I Joined new Server" })
            .setDescription(
                "**Server Information\n" +
                "```asciidoc\n" +
                `Server Name   :: ${sname} | ${guild.id}\n` +
                `Server Owner  :: ${owner!.tag} | ${owner!.id}\n` +
                `Member Count  :: ${membert} Member\n` +
                `              :: ${memberuser} User\n` +
                `              :: ${memberbot} Bot\n` +
                "```**"
            );
        const webhook = new WebhookClient({
            url:
                "https://discord.com/api/webhooks/875557228495659038/Fbfz3LmnXm8etVl4uOwXKdxRxJgqMane10byBydp8-vMgXAKiJYaB-OQSrbal3SMqBiK"
        });
        await webhook.send({ embeds: [e] });
    }
}
