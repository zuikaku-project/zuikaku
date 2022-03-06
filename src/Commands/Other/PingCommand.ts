import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "ping",
    description: "Get the bot's ping",
    usage: "ping",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {}
})
export default class PingCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();

        const before = Date.now();
        const pingBefore = createEmbed("info")
            .setDescription(
                ":ping_pong: **Pong! \n" +
                "`📶`Latency = <a:loading:804201332243955734>\n" +
                "`🖥️`Websocket = <a:loading:804201332243955734>**"
            );
        await ctx.send({ embeds: [pingBefore] });
        const websocket = this.client.ws.ping;
        const latency = Date.now() - before;

        const pingAfter = createEmbed("info")
            .setDescription(
                ":ping_pong: **Pong! \n" +
                `\`📶\`Latency = \`${latency}\` ms\n` +
                `\`🖥️\`Websocket = \`${websocket}\` ms**`
            );
        await ctx.send({ embeds: [pingAfter] });
    }

    /*
     * private async databasePing(): Promise<number> {
     *     const currentNano = process.hrtime();
     *     await this.client.db.db.command({ ping: 1 });
     *     const time = process.hrtime(currentNano);
     *     return ((time[0] * 1e9) + time[1]) * 1e-6;
     * }
     */
}
