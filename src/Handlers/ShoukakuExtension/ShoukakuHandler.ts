import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import {
    ISpotifyLyrics,
    LavalinkSource,
    LoadTrackResponse
} from "#zuikaku/types";
import petitio from "petitio";
import shoukaku, { JoinOptions } from "shoukaku";
import { Dispatcher, EmbedPlayer, Lyrics, PersistentQueue, TrackList } from ".";
import { PluginManager } from "./Plugin";

const { Constants, Libraries, Shoukaku } = shoukaku;

export class ShoukakuHandler extends Shoukaku {
    public plugin = new PluginManager(this, {
        clientId: this.client.config.api.spotify.clientId,
        clientSecret: this.client.config.api.spotify.clientSecret,
        usePluginMetadata: true,
        playlistLoadlimit: 2
    });

    public dispatcher = new Map<string, Dispatcher>();
    public embedPlayers = new Map<string, EmbedPlayer>();
    public persistentQueue = new PersistentQueue(this);
    public constructor(public client: ZuikakuClient) {
        super(new Libraries.DiscordJS(client), client.config.nodes, {
            moveOnDisconnect: true,
            resumable: true,
            reconnectTries: 3
        });
        void this.plugin._init();
    }

    public async handleJoin(opts: JoinOptions): Promise<Dispatcher> {
        if (this.dispatcher.has(opts.guildId))
            return this.dispatcher.get(opts.guildId)!;
        const getNode = this.getNode();
        const player = await getNode.joinChannel({
            guildId: opts.guildId,
            channelId: opts.channelId,
            shardId: opts.shardId,
            deaf: true
        });
        const dispatcher = new Dispatcher(this, player, opts);
        dispatcher.setTimeout(
            3 * 6e4,
            "Inactive player for 3 minutes. The player has been destroyed"
        );
        Object.defineProperty(dispatcher, "volume", {
            value: 100,
            enumerable: true,
            writable: true
        });
        return dispatcher;
    }

    public async getTracks(
        identifier: string,
        options?: LavalinkSource
    ): Promise<TrackList> {
        const searchTypes: Record<string, string> = {
            soundcloud: "scsearch:",
            youtube: "ytsearch:"
        };
        const parseQueryUrl = identifier
            .slice(
                identifier.search("http") >= 0 ? identifier.search("http") : 0
            )
            .split(" ")[0];
        const node = this.getNode();
        const url = new URL(node.rest.url);
        url.pathname = "/loadtracks";
        try {
            const response = await petitio(url)
                .query(
                    "identifier",
                    parseQueryUrl.includes("http")
                        ? parseQueryUrl
                        : `${searchTypes[options ?? "youtube"]}${identifier}`
                )
                // @ts-expect-error ShoukakuRest#auth is private
                .header("Authorization", node.rest.auth)
                .json<LoadTrackResponse>();
            return new TrackList(response);
        } catch (e) {
            return new TrackList({
                loadType: "LOAD_FAILED",
                tracks: [],
                exception: {
                    message: (e as Error).message,
                    severity: "COMMON"
                }
            });
        }
    }

    public async getLyrics(query: string): Promise<Lyrics> {
        const node = this.getNode();
        const url = new URL(node.rest.url);
        url.pathname = "/lyrics";
        try {
            const response = await petitio(url)
                .query("title", query)
                // @ts-expect-error ShoukakuRest#auth is private
                .header("Authorization", node.rest.auth)
                .json<ISpotifyLyrics>();
            return new Lyrics(response);
        } catch {
            return new Lyrics();
        }
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
        if (randomNode!.state === Constants.state.CONNECTED)
            return array[random as number];
        let idx = random;
        while (
            idx === random ||
            this.nodes.get(array[random as number])!.state ===
                Constants.state.CONNECTED
        )
            idx = randomNode;
        return array[random as number];
    }
}
