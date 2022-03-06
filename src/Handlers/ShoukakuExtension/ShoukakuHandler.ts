import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { chunk, createEmbed } from "@zuikaku/Utils";
import { Guild, MessageActionRow, TextBasedChannel, User } from "discord.js";
import petitio from "petitio";
import { Constants, JoinOptions, LavalinkSource, Libraries, Shoukaku, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import { GuildSettings } from "../Databases";
import { PluginManager } from "./Plugin";
import { QueueManager } from "./QueueManager";

export class ShoukakuHandler extends Shoukaku {
    public plugin = new PluginManager(this, { clientId: this.client.config.spcid, clientSecret: this.client.config.spcs, usePluginMetadata: true, playlistLoadlimit: 2 });
    public queue = new Map<string, QueueManager>();
    public readonly youtubeRegex!: RegExp;
    public readonly soundcloudRegex!: RegExp;
    public readonly spotifyRegex!: RegExp;
    public constructor(public client: ZuikakuClient) {
        super(new Libraries.DiscordJS(client), client.config.nodes, { moveOnDisconnect: true, resumable: true, reconnectTries: 3 });
        Object.defineProperties(this, {
            youtubeRegex: {
                value: /(?<link>(?:(?:https?:)?\/\/)?(?:www.|m.|music.)?(?:youtube\.com|youtu.be)(?:\/(?:[\w-]+\?v=|embed\/|v\/)?)(?:[\w-]+).*$)/
            },
            soundcloudRegex: {
                value: /(?<link>(?:https?:\/\/)(?:www.|m\.)?(?:soundcloud|snd)(?:\.com|\.sc|\.app|\.goo|\.gl)\/(?:.*)$)/
            },
            spotifyRegex: {
                value: /(?<link>(?:https:\/\/open\.spotify\.com\/(?:user\/[A-Za-z0-9]+\/)?|spotify:)(?<type>album|playlist|track|artist|episode|show)(?:[/:])(?<id>[A-Za-z0-9]+).*$)/
            }
        });
        void this.plugin._init();
    }

    public getRandomNode(loadBalancer = true): string {
        const array = [...this.nodes.keys()];
        if (!array.length) {
            this.client.config.nodes.filter(node => [...this.nodes.keys()].includes(node.name)).map(node => this.addNode(node));
            return this.getRandomNode();
        }
        if (loadBalancer) {
            const sorted = [...this.nodes.values()]
                .filter(node => node.state === Constants.state.CONNECTED)
                .map(node => ({ name: node.name, players: node.players.size }))
                .sort((x, i) => x.players - i.players)[0].name;
            let result = sorted || this.getRandomNode(false);
            if (!result) {
                this.client.config.nodes.map(node => this.addNode(node));
                result = this.getRandomNode();
            }
            return result;
        }
        const random = Math.floor(Math.random() * array.length) as any;
        const randomNode = this.nodes.get(array[random as number]);
        if (randomNode!.state === Constants.state.CONNECTED) return array[random as number];
        let idx = random;
        while (idx === random || (this.nodes.get(array[random as number]))!.state === Constants.state.CONNECTED) idx = randomNode;
        return array[random as number];
    }

    public async getTracks(query: string, option?: LavalinkSource): Promise<ShoukakuTrackList> {
        query = decodeURIComponent(query);
        const node = this.nodes.get(this.getRandomNode());
        if (this.youtubeRegex.test(query) || this.soundcloudRegex.test(query) || query.slice(query.search("http") >= 0 ? query.search("http") : 0).split(" ")[0].includes("http")) return node!.rest.resolve(query.slice(query.search("http") >= 0 ? query.search("http") : 0).split(" ")[0]);
        return node!.rest.resolve(query, option ?? "youtube");
    }

    public getGuildDatabase(guildId: string): Promise<GuildSettings | undefined> {
        return this.client.database.guilds.get(guildId);
    }

    public async getThumbnail(data: string): Promise<string | null> {
        let thumbnail;
        try {
            if (this.spotifyRegex.test(data)) {
                const { thumbnail_url: body } = await petitio(`https://open.spotify.com/oembed?url=${data}&format=json`)
                    .header({
                        "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                        Accept: "application/json"
                    }).json();
                thumbnail = body ? body : "";
            } else if (this.soundcloudRegex.test(data)) {
                const { thumbnail_url: body } = await petitio(`https://soundcloud.com/oembed?url=${data}&format=json`)
                    .header({
                        "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                        Accept: "application/json"
                    }).json();
                thumbnail = body ? body : "";
            } else if (this.youtubeRegex.test(data)) {
                const { thumbnail_url: body } = await petitio(`https://youtube.com/oembed?url=${data}&format=json`)
                    .header({
                        "User-Agent": `Mozilla/5.0 (Server; NodeJS ${process.version}; rv:1.0) Magma/1.0 (KHTML, like Gecko) TrackResolver/1.0`,
                        Accept: "application/json"
                    }).json();
                thumbnail = typeof body === "string" ? body : null;
            }
        } catch {
            thumbnail = null;
        }
        return thumbnail;
    }

    public async handleJoin(opts: JoinOptions): Promise<QueueManager> {
        if (this.queue.has(opts.guildId)) return this.queue.get(opts.guildId)!;
        const getNode = this.getNode();
        const player = await getNode.joinChannel({
            guildId: opts.guildId,
            channelId: opts.channelId,
            shardId: opts.shardId,
            deaf: true
        });
        const queue = new QueueManager(this, player, opts);
        queue.setTimeout(3 * 6e4, "Inactive player for 3 minutes. The player has been destroyed");
        Object.defineProperty(queue, "volume", { value: 100, enumerable: true, writable: true });
        return queue;
    }

    public async updateGuildPlayerEmbed(guild?: Guild): Promise<void> {
        if (!guild) return;
        const defaultImage = "https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png";
        const getGuildDatabase = await this.client.database.guilds.get(guild.id);
        const queue = this.queue.get(guild.id);
        if (getGuildDatabase?.guildPlayer?.channelId) {
            if (queue?.getTrackSize && queue.current) {
                const list = chunk(queue.tracks.map((x, i) => `**${++i}.** ${x.info.title!} [${x.info.isStream ? "◉ LIVE" : x.durationFormated!}]`), 10);
                const display = await this.getThumbnail(queue.current.info.uri!) ?? defaultImage;
                const embed = createEmbed("info")
                    .setAuthor({
                        name: queue.current.info.title!,
                        iconURL: this.client.user?.displayAvatarURL({ format: "png", size: 4096 }),
                        url: queue.current.info.uri
                    })
                    .setImage(display)
                    .setFooter({
                        // eslint-disable-next-line no-nested-ternary
                        text: queue.tracks.length ? `Zuikaku-ship | ${queue.tracks.length} Songs left ${queue.trackRepeat ? "| loop: Track" : queue.queueRepeat ? "| loop: Queue" : ""}` : `Zuikaku-ship ${queue.trackRepeat ? "| loop: Track" : queue.queueRepeat ? "| loop: Queue" : ""}`
                    });
                const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId);
                if (channelGuildPlayer?.isText()) {
                    const messageGuildPlayer = await channelGuildPlayer.messages.fetch(getGuildDatabase.guildPlayer.messageId).catch(() => undefined);
                    if (messageGuildPlayer && messageGuildPlayer.author.id === this.client.user?.id) {
                        const components = new MessageActionRow().addComponents(messageGuildPlayer.components[0].components.map(x => x.setDisabled(false)));
                        await messageGuildPlayer.edit({ embeds: [embed], content: `**__Queue list:__**${list.length > 1 ? `\n\n**And ${queue.getTrackSize - 1 - list[0].length} more...**` : ""}\n${list.length ? list[0].reverse().join("\n") : "Join a voice channel and request some song in here"}`, components: [components] }).catch(() => null);
                    }
                }
            } else {
                const embed = createEmbed("info")
                    .setAuthor({ name: "Nothing are playing rightnow", iconURL: this.client.user?.displayAvatarURL({ format: "png", size: 4096 }) })
                    .setImage("https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png")
                    .setFooter({ text: "Zuikaku-ship" });
                const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase.guildPlayer.channelId);
                if (channelGuildPlayer?.isText()) {
                    const messageGuildPlayer = await channelGuildPlayer.messages.fetch(getGuildDatabase.guildPlayer.messageId).catch(() => undefined);
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
                const messageGuildPlayer = await (channelGuildPlayer as TextBasedChannel).messages.fetch(getGuildDatabase!.guildPlayer!.messageId).catch(() => undefined);
                if (messageGuildPlayer && messageGuildPlayer.author.id === this.client.user?.id) {
                    await this.updateGuildPlayerEmbed(guild);
                    this.client.logger.info({ module: "guildPlayer", message: "guildPlayerEmbed has been updated" });
                }
            }
            if (getGuildDatabase?.persistenceQueue?.textId) {
                const guildQueue = await this.handleJoin({
                    guildId: guild.id,
                    channelId: getGuildDatabase.guildPlayer?.channelId ?? getGuildDatabase.persistenceQueue.voiceId,
                    shardId: guild.shardId,
                    deaf: true,
                    textId: getGuildDatabase.persistenceQueue.textId,
                    voiceId: getGuildDatabase.persistenceQueue.voiceId
                });
                if (getGuildDatabase.persistenceQueue.trackRepeat) await guildQueue.setTrackRepeat();
                if (getGuildDatabase.persistenceQueue.queueRepeat) await guildQueue.setQueueRepeat();
                if (getGuildDatabase.persistenceQueue.current) {
                    const { requester, durationFormated } = getGuildDatabase.persistenceQueue.current;
                    getGuildDatabase.persistenceQueue.current = new ShoukakuTrack(getGuildDatabase.persistenceQueue.current);
                    // @ts-expect-error Not export User
                    Object.defineProperty(getGuildDatabase.persistenceQueue.current, "requester", { value: new User(this.client, requester), enumerable: true, configurable: true });
                    Object.defineProperty(getGuildDatabase.persistenceQueue.current, "durationFormated", { value: durationFormated, enumerable: true, configurable: true });
                    await guildQueue.addTrack(getGuildDatabase.persistenceQueue.current);
                }
                if (getGuildDatabase.persistenceQueue.tracks.length) {
                    getGuildDatabase.persistenceQueue.tracks.map(track => {
                        const { requester, durationFormated } = track;
                        track = new ShoukakuTrack(track);
                        // @ts-expect-error Not export User
                        Object.defineProperty(track, "requester", { value: new User(this.client, requester), enumerable: true, configurable: true });
                        Object.defineProperty(track, "requester", { value: durationFormated, enumerable: true, configurable: true });
                        return track;
                    });
                    await guildQueue.addTrack(getGuildDatabase.persistenceQueue.tracks);
                }
                await guildQueue.playTrack(getGuildDatabase.persistenceQueue.position);
                this.client.logger.info({ module: "persistenceQueue", message: "persistenceQueue has been assigned" });
            }
        });
        this.client.logger.info({ module: "DATABASE", message: "database has been assigned" });
    }
}
