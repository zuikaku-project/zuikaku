import {
    isNoNodesAvailable, isQueueReachLimit, isSameTextChannel,
    isSameVoiceChannel, isUserInTheVoiceChannel, isValidVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { QueueManager } from "@zuikaku/Handlers/ShoukakuExtension";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, createMusicEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageSelectMenu, Util } from "discord.js";
import { ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<ICommandComponent>({
    name: "play",
    description: "Play track from any source",
    usage: "{CATEGORY} play {ABRACKETSL}query{ABRACKETSR} [search]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Song query",
                required: true
            },
            {
                name: "search",
                type: "BOOLEAN",
                description: "search song"
            }
        ]
    },
    contextChat: "Queued this"
})
export default class PlayCommand extends ZuikakuCommand {
    @isUserInTheVoiceChannel()
    @isValidVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    @isQueueReachLimit()
    @isNoNodesAvailable()
    public async execute(ctx: CommandContext): Promise<void> {
        const getGuildDatabase = await this.client.database.guilds.get(ctx.guild!.id);
        const fromGuildPlayer = getGuildDatabase?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(fromGuildPlayer);
        if (
            getGuildDatabase?.guildPlayer?.channelId &&
            getGuildDatabase.guildPlayer.channelId !== ctx.channel!.id
        ) {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**<a:decline:879311910045097984> | Operation Canceled. " +
                        `This command is restrictred to ${this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId)?.toString() ?? "unknown"}**`)
                ]
            });
            return undefined;
        }

        const search = ctx.options?.getString("query") ??
            ctx.options?.getMessage("message")?.content ??
            ctx.args.join(" ");
        if (!search.trim().length) {
            if (!ctx.isInteraction()) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(ctx, "info", "You not give me query")
                    ]
                });
                return undefined;
            }
        }

        const guildQueue = await this.client.shoukaku.handleJoin({
            guildId: ctx.guild!.id,
            channelId: ctx.member!.voice.channel!.id,
            shardId: ctx.guild!.shard.id,
            textId: ctx.channel!.id,
            voiceId: ctx.member!.voice.channel!.id
        });
        const getTracks = await this.client.shoukaku.getTracks(search.trim());
        if (
            ["LOAD_FAILED", "NO_MATCHES"].includes(getTracks.type) ||
            !getTracks.tracks.length
        ) {
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", `I can't get any result for ${search.trim()}`)
                ]
            })
                .then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined)
                .catch(() => null);
            return undefined;
        }

        if (getTracks.type === "PLAYLIST") {
            await guildQueue.addTrack(getTracks.tracks.map(track => {
                Object.defineProperty(track, "requester", {
                    value: ctx.author,
                    enumerable: true,
                    configurable: true
                });
                Object.defineProperty(track, "durationFormated", {
                    value: this.client.utils.parseMs(track.info.length!, { colonNotation: true }).colonNotation,
                    enumerable: true,
                    configurable: true
                });
                return track;
            }));
            if (fromGuildPlayer) {
                await this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!);
            }
            await ctx.send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        `I enqueued ${getTracks.tracks.length} track(s) from ` +
                        `${Util.escapeMarkdown(getTracks.playlistName!)} ` +
                        `(${this.client.utils
                            .parseMs(
                                Number(
                                    // eslint-disable-next-line no-eval
                                    eval(
                                        getTracks.tracks.map(track => track.info.length).join("+")
                                    )
                                ), { colonNotation: true }
                            ).colonNotation})`
                    )
                ]
            })
                .then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined)
                .catch(() => null);
        } else if (ctx.args.includes("--search") || ctx.options?.getBoolean("search")) {
            return this.flags(ctx, getTracks, guildQueue, fromGuildPlayer);
        } else {
            await guildQueue
                .addTrack(getTracks.tracks.slice(0, 1)
                    .map(track => {
                        Object.defineProperty(track, "requester", {
                            value: ctx.author,
                            enumerable: true,
                            configurable: true
                        });
                        Object.defineProperty(track, "durationFormated", {
                            value: this.client.utils.parseMs(track.info.length!, { colonNotation: true }).colonNotation,
                            enumerable: true,
                            configurable: true
                        });
                        return track;
                    }));
            if (fromGuildPlayer) {
                await this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!);
            }
            if (!fromGuildPlayer || ctx.isInteraction()) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `I enqueued track ${getTracks.tracks[0].info.title!} ` +
                            `(${this.client.utils
                                .parseMs(
                                    getTracks.tracks[0].info.length!, { colonNotation: true }
                                ).colonNotation})`
                        )
                    ]
                });
            }
        }
        if (guildQueue._timeout || !guildQueue.player.track) {
            await guildQueue.playTrack();
        }
    }

    private async flags(
        ctx: CommandContext,
        getTracks: ShoukakuTrackList,
        guildQueue: QueueManager,
        fromGuildPlayer: boolean
    ): Promise<void> {
        const tracks = getTracks.tracks.slice(0, 10);
        const array = tracks.map((track, i) => ({
            label: `${track.info.title!.length >= 90 ? `${track.info.title!.substring(0, 90)}...` : track.info.title!}`,
            value: `${i++}`
        }));
        const row = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId("SongSelect")
                    .setMinValues(1)
                    .setMaxValues(array.length)
                    .setPlaceholder("Select in here")
                    .addOptions(array)
            );
        const send = await ctx.send({
            content: "ㅤ",
            components: [row]
        }, "followUp");
        const collector = send.createMessageComponentCollector({
            filter: x => ["SongSelect"].includes(x.customId),
            time: 30_000
        });
        collector.on("collect", async int => {
            await int.deferUpdate();
            if (int.isSelectMenu()) {
                if (int.user.id === ctx.author.id) {
                    const resolveTrack = int.values.map(value => tracks[value as unknown as number]);
                    resolveTrack.map(track => {
                        Object.defineProperty(track, "requester", {
                            value: ctx.author,
                            enumerable: true,
                            configurable: true
                        });
                        Object.defineProperty(track, "durationFormated", {
                            value: this.client.utils.parseMs(track.info.length!, { colonNotation: true }).colonNotation,
                            enumerable: true,
                            configurable: true
                        });
                        return track;
                    });
                    await guildQueue.addTrack(resolveTrack);
                    await this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!);
                    if (guildQueue._timeout || !guildQueue.player.track) {
                        await guildQueue.playTrack();
                    }
                    await ctx.send({
                        embeds: [
                            createMusicEmbed(
                                ctx,
                                "info",
                                `I enqueued ${int.values.length} track(s) ` +
                                `(${this.client.utils
                                    .parseMs(
                                        Number(
                                            // eslint-disable-next-line no-eval
                                            eval(
                                                resolveTrack.map(shoukakuTrack => shoukakuTrack.info.length).join("+")
                                            )
                                        ), { colonNotation: true }
                                    ).colonNotation})`
                            )
                        ],
                        components: []
                    })
                        .then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined)
                        .catch(() => null);
                    setTimeout(() => send.delete().catch(() => null), 5000);
                    collector.stop("Finished");
                } else {
                    await int.reply({
                        embeds: [
                            createEmbed("info", `**Sorry, but this interaction only for ${ctx.author.toString()}**`)
                        ],
                        ephemeral: true
                    });
                }
            }
        });
        collector.on("end", (_, reason) => {
            if (reason !== "Finished") {
                const rowSelectMenuEnd = row;
                (rowSelectMenuEnd.components[0] as MessageSelectMenu)
                    .setPlaceholder("This interaction has been disabled due to no respond")
                    .setDisabled();
                void ctx.send({
                    content: "ㅤ",
                    components: [rowSelectMenuEnd]
                })
                    .then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
            }
        });
    }
}
