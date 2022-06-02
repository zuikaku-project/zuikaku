import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import { Response } from "#zuikaku/types";
import { LavalinkSearchPrefix } from "#zuikaku/types/enum";
import { Connectors, Constants, Shoukaku, VoiceChannelOptions } from "shoukaku";
import { Dispatcher, EmbedPlayer, Lyrics, PersistentQueue, TrackList } from ".";
import { PluginManager } from "./Plugin";
import { ShoukakuPlayer, ShoukakuRest } from "./Structures/Shoukaku";

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
        super(new Connectors.DiscordJS(client), client.config.lavalink.nodes, {
            moveOnDisconnect: true,
            resume: true,
            resumeKey: "EnterpriseWangy",
            reconnectTries: 3,
            structures: {
                rest: ShoukakuRest,
                player: ShoukakuPlayer
            }
        });
        void this.plugin._init();
    }

    public async handleJoin(opts: VoiceChannelOptions): Promise<Dispatcher> {
        if (this.dispatcher.has(opts.guildId))
            return this.dispatcher.get(opts.guildId)!;
        const getNode = this.getNode();
        const player = await getNode!.joinChannel({
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
        options?: keyof typeof LavalinkSearchPrefix
    ): Promise<TrackList> {
        const parseQueryUrl = identifier
            .slice(
                identifier.search("http") >= 0 ? identifier.search("http") : 0
            )
            .split(" ")[0];

        const node = this.getNode();
        try {
            const response = (await node!.rest.resolve(
                parseQueryUrl.includes("http")
                    ? parseQueryUrl
                    : `${
                          LavalinkSearchPrefix[
                              options ??
                                  this.client.config.lavalink.searchStrategy
                          ]
                      }${identifier}`
            ))!;
            return new TrackList(response as unknown as Response);
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
        return (node?.rest as ShoukakuRest).getLyrics(query);
    }

    public getRandomNode(loadBalancer = true): string {
        const array = [...this.nodes.keys()];
        if (loadBalancer) {
            const sorted = [...this.nodes.values()]
                .filter(node => node.state === Constants.State.CONNECTED)
                .map(node => ({ name: node.name, players: node.players.size }))
                .sort((x, i) => x.players - i.players)[0].name;
            const result = sorted || this.getRandomNode(false);
            return result;
        }
        const random = Math.floor(Math.random() * array.length) as any;
        const randomNode = this.nodes.get(array[random as number]);
        if (randomNode!.state === Constants.State.CONNECTED)
            return array[random as number];
        let idx = random;
        while (
            idx === random ||
            this.nodes.get(array[random as number])!.state ===
                Constants.State.CONNECTED
        )
            idx = randomNode;
        return array[random as number];
    }
}
