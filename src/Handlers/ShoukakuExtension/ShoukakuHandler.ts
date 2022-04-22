import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { LoadTrackResponse } from "@zuikaku/types";
import { chunk, createEmbed } from "@zuikaku/Utils";
import { Guild, MessageActionRow, TextBasedChannel, User } from "discord.js";
import { Constants, JoinOptions, LavalinkSource, Libraries, Shoukaku } from "shoukaku";
import { Dispatcher, Track, TrackList } from ".";
import { GuildSettings } from "../Databases";
import { PluginManager } from "./Plugin";

export class ShoukakuHandler extends Shoukaku {
    public plugin = new PluginManager(this, { clientId: this.client.config.spcid, clientSecret: this.client.config.spcs, usePluginMetadata: true, playlistLoadlimit: 2 });
    public dispatcher = new Map<string, Dispatcher>();
    public constructor(public client: ZuikakuClient) {
        super(new Libraries.DiscordJS(client), client.config.nodes, { moveOnDisconnect: true, resumable: true, reconnectTries: 3 });
        void this.plugin._init();
    }

    public getRandomNode(loadBalancer = true): string {
        const array = [...this.nodes.keys()];
        if (loadBalancer) {
            const sorted = [...this.nodes.values()]
                .filter(node => node.state === Constants.state.CONNECTED)
                .map(node => ({ name: node.name, players: node.players.size }))
                .sort((x, i) => x.players - i.players)[0].name;
            const result = sorted || this.getRandomNode(false);
            return result;
        }
        const random = Math.floor(Math.random() * array.length) as any;
        const randomNode = this.nodes.get(array[random as number]);
        if (randomNode!.state === Constants.state.CONNECTED) return array[random as number];
        let idx = random;
        while (idx === random || (this.nodes.get(array[random as number]))!.state === Constants.state.CONNECTED) idx = randomNode;
        return array[random as number];
    }

    public async getTracks(query: string, option?: LavalinkSource): Promise<TrackList> {
        query = decodeURIComponent(query);
        const searchTypes: Record<LavalinkSource, string> = { soundcloud: "scsearch:", youtube: "ytsearch:", youtubemusic: "ytmsearch:" };
        if (
            query.slice(query.search("http") >= 0 ? query.search("http") : 0).split(" ")[0].includes("http")
        ) {
            const identifier = query.slice(query.search("http") >= 0 ? query.search("http") : 0).split(" ")[0];
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'getTracks' does not exist on type 'ShoukakuHandler'.
            const requestTracks = await this.getNode()?.rest.router.loadtracks({ identifier }).get() as unknown as LoadTrackResponse // eslint-disable-line
            return new TrackList(requestTracks);
        }
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'getTracks' does not exist on type 'ShoukakuHandler'.
        const requestTracks = await this.getNode()?.rest.router.loadtracks({ identifier: `${searchTypes[option ?? "youtube"]}:${query}` }).get() as unknown as LoadTrackResponse // eslint-disable-line
        return new TrackList(requestTracks);
    }

    public getGuildDatabase(guildId: string): Promise<GuildSettings | undefined> {
        return this.client.database.entity.guilds.get(guildId);
    }

    public async handleJoin(opts: JoinOptions): Promise<Dispatcher> {
        if (this.dispatcher.has(opts.guildId)) return this.dispatcher.get(opts.guildId)!;
        const getNode = this.getNode();
        const player = await getNode.joinChannel({
            guildId: opts.guildId,
            channelId: opts.channelId,
            shardId: opts.shardId,
            deaf: true
        });
        const dispatcher = new Dispatcher(this, player, opts);
        dispatcher.setTimeout(3 * 6e4, "Inactive player for 3 minutes. The player has been destroyed");
        Object.defineProperty(dispatcher, "volume", { value: 100, enumerable: true, writable: true });
        return dispatcher;
    }

    public async updateGuildPlayerEmbed(guild?: Guild): Promise<void> {
        if (!guild) return;
        const defaultImage = "https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png";
        const getGuildDatabase = await this.client.database.entity.guilds.get(guild.id);
        const dispatcher = this.dispatcher.get(guild.id);
        if (getGuildDatabase?.guildPlayer?.channelId) {
            if (dispatcher?.queue.getTrackSize && dispatcher.queue.current) {
                const list = chunk(
                    dispatcher.queue.tracks
                        .map((x, i) => `**${++i}.** ${x.info.title!} [${x.info.isStream ? "◉ LIVE" : x.durationFormated ?? "0:00"}]`),
                    10
                );
                const display = dispatcher.queue.current.thumbnail ?? defaultImage;
                const embed = createEmbed("info")
                    .setAuthor({
                        name: dispatcher.queue.current.info.title!,
                        iconURL: this.client.user?.displayAvatarURL({ format: "png", size: 4096 }),
                        url: dispatcher.queue.current.info.uri
                    })
                    .setImage(display)
                    .setFooter({
                        // eslint-disable-next-line no-nested-ternary
                        text: dispatcher.queue.tracks.length ? `Zuikaku-ship | ${dispatcher.queue.tracks.length} Songs left ${dispatcher.trackRepeat ? "| loop: Track" : dispatcher.queueRepeat ? "| loop: Queue" : ""}` : `Zuikaku-ship ${dispatcher.trackRepeat ? "| loop: Track" : dispatcher.queueRepeat ? "| loop: Queue" : ""}`
                    });
                const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId);
                if (channelGuildPlayer?.isText()) {
                    const messageGuildPlayer = await channelGuildPlayer.messages
                        .fetch(getGuildDatabase.guildPlayer.messageId)
                        .catch(() => undefined);
                    if (messageGuildPlayer && messageGuildPlayer.author.id === this.client.user?.id) {
                        const components = new MessageActionRow()
                            .addComponents(
                                messageGuildPlayer
                                    .components[0]
                                    .components
                                    .map(x => x.setDisabled(false))
                            );
                        await messageGuildPlayer.edit({
                            embeds: [embed],
                            content: `**__Queue list:__**${list.length > 1 ? `\n\n**And ${dispatcher.queue.getTrackSize - 1 - list[0].length} more...**` : ""}\n${list.length ? list[0].reverse().join("\n") : "Join a voice channel and request some song in here"}`,
                            components: [components]
                        }).catch(() => null);
                    }
                }
            } else {
                const embed = createEmbed("info")
                    .setAuthor({
                        name: "Nothing are playing rightnow",
                        iconURL: this.client.user?.displayAvatarURL({ format: "png", size: 4096 })
                    })
                    .setImage("https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png")
                    .setFooter({
                        text: "Zuikaku-ship"
                    });
                const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId);
                if (channelGuildPlayer?.isText()) {
                    const messageGuildPlayer = await channelGuildPlayer.messages
                        .fetch(getGuildDatabase.guildPlayer.messageId)
                        .catch(() => undefined);
                    if (messageGuildPlayer && messageGuildPlayer.author.id === this.client.user?.id) {
                        const component = messageGuildPlayer.components[0].components.slice(1).map(x => x.setDisabled());
                        component.unshift(messageGuildPlayer.components[0].components[0]);
                        const components = new MessageActionRow().addComponents(
                            guild.me?.voice.channelId ? component : messageGuildPlayer.components[0].components.map(x => x.setDisabled())
                        );
                        await messageGuildPlayer.edit({ embeds: [embed], content: " ", components: [components] }).catch(() => null);
                    }
                }
            }
        }
    }

    public assignPersistenceQueue(): void {
        this.client.guilds.cache.map(async guild => {
            const getGuildDatabase = await this.getGuildDatabase(guild.id);
            const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase?.guildPlayer?.channelId ?? "");
            if (channelGuildPlayer) {
                const messageGuildPlayer = await (channelGuildPlayer as TextBasedChannel).messages
                    .fetch(getGuildDatabase!.guildPlayer!.messageId)
                    .catch(() => undefined);
                if (messageGuildPlayer && messageGuildPlayer.author.id === this.client.user?.id) {
                    await this.updateGuildPlayerEmbed(guild);
                    this.client.logger.info({
                        module: "guildPlayer",
                        message: "guildPlayerEmbed has been updated"
                    });
                }
            }
            if (getGuildDatabase?.persistenceQueue?.textId) {
                const dispatcher = await this.handleJoin({
                    guildId: guild.id,
                    channelId: getGuildDatabase.guildPlayer?.channelId ?? getGuildDatabase.persistenceQueue.voiceId,
                    shardId: guild.shardId,
                    deaf: true,
                    textId: getGuildDatabase.persistenceQueue.textId,
                    voiceId: getGuildDatabase.persistenceQueue.voiceId
                });
                if (getGuildDatabase.persistenceQueue.trackRepeat) await dispatcher.setTrackRepeat();
                if (getGuildDatabase.persistenceQueue.queueRepeat) await dispatcher.setQueueRepeat();
                if (getGuildDatabase.persistenceQueue.current) {
                    const currentPersistent = getGuildDatabase.persistenceQueue.current;
                    // @ts-expect-error Not export User
                    const requester = new User(this.client, currentPersistent._requester) as User;
                    getGuildDatabase.persistenceQueue.current = new Track(currentPersistent);
                    getGuildDatabase.persistenceQueue.current.setRequester(requester);
                    getGuildDatabase.persistenceQueue.current.setShoukaku(this);
                    await dispatcher.queue.addTrack(getGuildDatabase.persistenceQueue.current);
                }
                if (getGuildDatabase.persistenceQueue.tracks.length) {
                    getGuildDatabase.persistenceQueue.tracks.map(track => {
                        // @ts-expect-error Not export User
                        const requester = new User(this.client, track._requester) as User;
                        track = new Track(track);
                        track.setRequester(requester);
                        track.setShoukaku(this);
                    });
                    await dispatcher.queue.addTrack(getGuildDatabase.persistenceQueue.tracks);
                }
                await dispatcher.playTrack(getGuildDatabase.persistenceQueue.position);
                this.client.logger.info({
                    module: "persistenceQueue",
                    message: "persistenceQueue has been assigned"
                });
            }
        });
        this.client.logger.info({
            module: "DATABASE",
            message: "database has been assigned"
        });
    }
}
