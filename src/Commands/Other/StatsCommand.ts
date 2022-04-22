import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { ShoukakuSocketState } from "@zuikaku/types/enum";
import { createEmbed } from "@zuikaku/Utils";
import { EmbedField, version } from "discord.js";
import os from "os";

@ZuikakuDecorator<ICommandComponent>({
    name: "stats",
    description: "Display node/bot statistics",
    usage: "stats lavalink|zuikaku",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "lavalink",
                type: "SUB_COMMAND",
                description: "Display node statistics"
            }, {
                name: "zuikaku",
                type: "SUB_COMMAND",
                description: "Display bot statistics"
            }
        ]
    }
})
export default class StatsCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        if (ctx.options?.getSubcommand(false) === "lavalink") {
            this.displayNodesStats(ctx);
        } else {
            this.displayBotStats(ctx);
        }
    }

    private displayNodesStats(ctx: CommandContext): void {
        if ([...this.client.shoukaku.nodes].length === 0) {
            void ctx.send({
                embeds: [
                    createEmbed("info", "No nodes found")
                ],
                deleteButton: { reference: ctx.author.id }
            });
            return;
        }
        const shoukakuNodes = [...this.client.shoukaku.nodes.values()].map(({ name, state, stats }) => ({ name, state, core: stats.cpu.cores, uptime: this.client.utils.parseMs(stats.uptime, { humanTime: true }).humanTime, memory: this.getBytes(stats.memory.used), players: `${stats.playingPlayers}/${stats.players}` }));
        const nodesStatsEmbed = [] as EmbedField[];
        nodesStatsEmbed.push(...shoukakuNodes.map(({ name, state, core, uptime, memory, players }) => ({
            name,
            value: "```\n" +
                `• State : ${ShoukakuSocketState[state]}\n` +
                `• Uptime : ${uptime}\n` +
                `• Core(s) : ${core}\n` +
                `• Player(s) : ${players}\n` +
                `• Memory Usage : ${memory}` +
                "\n```",
            inline: false
        })));
        const statsEmbed = createEmbed("info").setFields(nodesStatsEmbed);
        void ctx.send({ embeds: [statsEmbed], deleteButton: { reference: ctx.author.id } });
    }

    private displayBotStats(ctx: CommandContext): void {
        const statsEmbed = createEmbed("info").setDescription(
            "```\n" +
            `• Discord.js : ${version}\n` +
            `• Node.js : ${process.version}\n` +
            `• Platform : ${os.platform()} ${os.arch()} Bit\n` +
            `• Memory Usage : ${this.client.totalMemory("rss")!}\n` +
            `• Guild : ${this.client.guilds.cache.size} Guild(s)\n` +
            `• OS Uptime : ${this.client.utils.parseMs(os.uptime() * 1000, { humanTime: true }).humanTime}\n` +
            `• Process Uptime : ${this.client.utils.parseMs(process.uptime() * 1000, { humanTime: true }).humanTime}\n` +
            `• Processor : ${os.cpus().map(i => `${i.model}`)[0]}\n` +
            "```"
        );
        void ctx.send({ embeds: [statsEmbed] });
    }

    private getBytes(bytes: number): string {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
    }

    private genembed(data: any[]): any {
        const arr = [];
        const arrcurrent = [];
        let k = 3;
        for (let i = 0; i < data.length; i += 3) {
            arrcurrent.push(data.slice(i, k));
            k += 3;
        }
        for (const current of arrcurrent.values()) {
            const e = createEmbed("info").setAuthor({ name: "LavalinkNodes", iconURL: this.client.user!.displayAvatarURL({ size: 4096, format: "png" })! });
            current.map((x: { core: number; memory: number; node: string; ping: string; players: number; playing: number; state: string; uptime: string }) => e.addFields([
                {
                    name: x.node,
                    value:
                        "```asciidoc\n" +
                        `• Status    :: ${x.state}\n` +
                        `• Cores     :: ${x.core}\n` +
                        `• Uptime    :: ${x.uptime}\n` +
                        `• Mem. Used :: ${(x.memory / Math.pow(1024, Math.floor(Math.log(x.memory) / Math.log(1024)))).toFixed(2)} ${["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][Math.floor(Math.log(x.memory) / Math.log(1024))]}\n` +
                        `• Player    :: ${x.players}\n` +
                        `• Playing   :: ${x.playing}\n` +
                        "\n```"
                }
            ]));
            arr.push(e);
        }
        return arr;
    }
}
