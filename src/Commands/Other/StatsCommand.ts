import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { IChangelog, ICommandComponent } from "#zuikaku/types";
import { ShoukakuSocketState } from "#zuikaku/types/enum";
import { createEmbed, Utils } from "#zuikaku/Utils";
import { EmbedField, version } from "discord.js";
import { readFileSync } from "fs";
import os from "os";
import { join } from "path";

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
            },
            {
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
                embeds: [createEmbed("info", "No nodes found")],
                deleteButton: { reference: ctx.author.id }
            });
            return;
        }
        const shoukakuNodes = [...this.client.shoukaku.nodes.values()].map(
            ({ name, state, stats }) => ({
                name,
                state,
                core: stats.cpu.cores,
                uptime: Utils.parseMs(stats.uptime, {
                    humanTime: true
                }).humanTime,
                memory: this.getBytes(stats.memory.used),
                players: `${stats.playingPlayers}/${stats.players}`
            })
        );
        const nodesStatsEmbed = [] as EmbedField[];
        nodesStatsEmbed.push(
            ...shoukakuNodes.map(
                ({ name, state, core, uptime, memory, players }) => ({
                    name,
                    value:
                        "```\n" +
                        `• State : ${ShoukakuSocketState[state]}\n` +
                        `• Uptime : ${uptime}\n` +
                        `• Core(s) : ${core}\n` +
                        `• Player(s) : ${players}\n` +
                        `• Memory Usage : ${memory}` +
                        "\n```",
                    inline: false
                })
            )
        );
        const statsEmbed = createEmbed("info").setFields(nodesStatsEmbed);
        void ctx.send({
            embeds: [statsEmbed],
            deleteButton: { reference: ctx.author.id }
        });
    }

    private displayBotStats(ctx: CommandContext): void {
        const lastChangelog = Utils.parseYaml<IChangelog[]>(
            join("Changelog.yaml")
        ).slice(-1)[0];
        const statsEmbed = createEmbed("info")
            .setAuthor({
                name: this.client.user!.username,
                iconURL: this.client.user!.displayAvatarURL(),
                url: "https://zui.my.id/"
            })
            .addFields([
                {
                    name: "Information",
                    value:
                        "```\n" +
                        `• Version : ${
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                            this.getPackageJson().version as unknown as string
                        }\n` +
                        `• Discord.js : ${version}\n` +
                        `• Node.js : ${process.version}\n` +
                        `• Platform : ${os.platform()} ${os.arch()} Bit\n` +
                        `• Memory Usage : ${this.client.totalMemory(
                            "rss"
                        )!}\n` +
                        `• Guild : ${this.client.guilds.cache.size} Guild(s)\n` +
                        `• OS Uptime : ${
                            Utils.parseMs(os.uptime() * 1000, {
                                humanTime: true
                            }).humanTime
                        }\n` +
                        `• Process Uptime : ${
                            Utils.parseMs(process.uptime() * 1000, {
                                humanTime: true
                            }).humanTime
                        }\n` +
                        `• Processor : ${
                            os.cpus().map(i => `${i.model}`)[0]
                        }\n` +
                        "```"
                },
                {
                    name: "Last Update",
                    value:
                        `\`\`\`\n` +
                        `${lastChangelog.title}\n${lastChangelog.content
                            .map((x, i) => `${i + 1}. ${x}`)
                            .join("\n")}\n` +
                        `\`\`\``
                }
            ]);
        void ctx.send({ embeds: [statsEmbed] });
    }

    private getBytes(bytes: number): string {
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${
            sizes[i]
        }`;
    }

    private getPackageJson(): any {
        return JSON.parse(
            readFileSync(join(`${process.cwd()}/package.json`), "utf-8")
        );
    }
}
