import { IPluginComponent, AppleMusicMetaTagResponse, AppleTracks, DeezerTrack, ILavalinkPayloadTrack, IPluginOptions, SpotifyTrack } from "@zuikaku/types";
import { load } from "cheerio";
import { Collection } from "discord.js";
import { join, resolve } from "node:path";
import petitio from "petitio";
import { LavalinkSource, ShoukakuSocket, ShoukakuTrack, ShoukakuTrackList } from "shoukaku";
import { ShoukakuHandler } from "..";
import Util from "./Util";

export class PluginManager {
    public headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36" };

    public readonly appleRegex!: RegExp;
    public readonly deezerRegex!: RegExp;
    public readonly spotifyRegex!: RegExp;
    public readonly appleBaseURL!: string;
    public readonly deezerBaseURL!: string;
    public readonly spotifyBaseURL!: string;
    public readonly appleToken!: string;
    public readonly spotifyToken!: string;
    public readonly appleResolver!: Collection<string, IPluginComponent>;
    public readonly deezerResolver!: Collection<string, IPluginComponent>;
    public readonly spotifyResolver!: Collection<string, IPluginComponent>;

    private readonly _getTracks!: (query: string, options?: LavalinkSource) => Promise<ShoukakuTrackList>;
    private spotifyNextRequest?: NodeJS.Timeout;

    public constructor(public shoukaku: ShoukakuHandler, public pluginOptions: IPluginOptions) {
        Object.defineProperty(this, "_getTracks", { value: this.shoukaku.getTracks.bind(this.shoukaku) });
        Object.defineProperty(this, "appleRegex", { value: /(?<link>(?:https:\/\/music\.apple\.com\/)(?:.+)?(?<type>artist|album|music-video|playlist)\/(?<title>[\w\-.]\/[\w\-.]+|[^&]+)\/(?<id>[\w\-.]\/[\w\-.]+|[^&]+))/ });
        Object.defineProperty(this, "deezerRegex", { value: /(?<link>(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist|artist)\/(?<id>\d+))/ });
        Object.defineProperty(this, "spotifyRegex", { value: /(?<link>(?:https:\/\/open\.spotify\.com\/(?:user\/[A-Za-z0-9]+\/)?|spotify:)(?<type>album|playlist|track|artist|episode|show)(?:[/:])(?<id>[A-Za-z0-9]+).*$)/ });
        Object.defineProperty(this, "appleBaseURL", { value: "https://amp-api.music.apple.com/v1/catalog/us" });
        Object.defineProperty(this, "deezerBaseURL", { value: "https://api.deezer.com" });
        Object.defineProperty(this, "spotifyBaseURL", { value: "https://api.spotify.com/v1" });
        Object.defineProperty(this, "appleToken", { value: null, configurable: true });
        Object.defineProperty(this, "spotifyToken", { value: null, configurable: true });
        Object.defineProperty(this, "appleResolver", { value: new Collection(), configurable: true, enumerable: true });
        Object.defineProperty(this, "deezerResolver", { value: new Collection(), configurable: true, enumerable: true });
        Object.defineProperty(this, "spotifyResolver", { value: new Collection(), configurable: true, enumerable: true });
    }

    public async _init(): Promise<void> {
        this.shoukaku.getTracks = this.getTracks.bind(this);
        await this.fetchAppleToken();
        await this.requestSpotifyToken();
        await this._loadPluginResolver();
    }

    public async _loadPluginResolver(): Promise<void> {
        const getPluginFile = this.shoukaku.client.utils.readdirRecursive(join(__dirname, "./Plugins"));
        for (const pluginFile of getPluginFile) {
            const plugin = await this.shoukaku.client.utils.import<IPluginComponent>(resolve(pluginFile), this);
            if (plugin === undefined) {
                console.log(plugin, pluginFile);
                continue;
            }
            if (plugin.meta.category === "apple") this.appleResolver.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "deezer") this.deezerResolver.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "spotify") this.spotifyResolver.set(plugin.meta.name, plugin);
        }
    }

    public getNode(query?: string[] | string): ShoukakuSocket {
        return this.shoukaku.getNode(query);
    }

    public async resolve(unresolvedTrack: ILavalinkPayloadTrack): Promise<ShoukakuTrack | undefined> {
        const lavaTrack = await this.retrieveTrack(unresolvedTrack);
        if (lavaTrack) {
            if (this.pluginOptions.usePluginMetadata) {
                Object.assign(lavaTrack.info, {
                    identifier: unresolvedTrack.info.identifier,
                    author: unresolvedTrack.info.author,
                    title: unresolvedTrack.info.title,
                    uri: unresolvedTrack.info.uri,
                    length: unresolvedTrack.info.length
                });
            }
        }
        return Util.structuredClone(lavaTrack);
    }

    public async retrieveTrack(unresolvedTrack: ILavalinkPayloadTrack): Promise<ShoukakuTrack | undefined> {
        const response = await this.getTracks(`${unresolvedTrack.info.author ?? ""} ${unresolvedTrack.info.title ?? ""}`);
        return response.tracks[0];
    }

    public buildUnresolved(unresolvedTrack: AppleTracks | DeezerTrack | SpotifyTrack): ILavalinkPayloadTrack {
        return {
            track: "",
            info: {
                identifier: (unresolvedTrack as AppleTracks).id ??
                    (unresolvedTrack as DeezerTrack).id ??
                    (unresolvedTrack as SpotifyTrack).id ??
                    "",
                title: (unresolvedTrack as AppleTracks).name ??
                    (unresolvedTrack as DeezerTrack).title ??
                    (unresolvedTrack as SpotifyTrack).name ??
                    "",
                author: (unresolvedTrack as AppleTracks).artistName ??
                    (unresolvedTrack as DeezerTrack).artist?.name ??
                    (unresolvedTrack as SpotifyTrack).artists?.map(x => x.name).join(" ") ??
                    "",
                length: (unresolvedTrack as AppleTracks).durationInMillis ??
                    (unresolvedTrack as DeezerTrack).duration ??
                    (unresolvedTrack as SpotifyTrack).duration_ms ??
                    0,
                uri: (unresolvedTrack as AppleTracks).url ??
                    (unresolvedTrack as DeezerTrack).link ??
                    (unresolvedTrack as SpotifyTrack).external_urls?.spotify ??
                    ""
            }
        };
    }

    public buildResponse(loadType: "LOAD_FAILED" | "NO_MATCHES", tracks: []): ShoukakuTrackList;
    public buildResponse(loadType: "SEARCH_RESULT" | "TRACK_LOADED", tracks: ShoukakuTrack[]): ShoukakuTrackList;
    public buildResponse(loadType: "PLAYLIST_LOADED", tracks: ShoukakuTrack[], playlistInfo: { name: string; selectedTrack: number }): ShoukakuTrackList;
    public buildResponse(loadType: "LOAD_FAILED" | "NO_MATCHES" | "PLAYLIST_LOADED" | "SEARCH_RESULT" | "TRACK_LOADED", tracks: ShoukakuTrack[] = [], playlistInfo?: { name?: string; selectedTrack?: number }): ShoukakuTrackList {
        const buildShoukakuTrackList = new ShoukakuTrackList({
            loadType,
            tracks,
            playlistInfo
        });
        buildShoukakuTrackList.tracks.map(track => {
            track.resolve = async () => {
                const validated = buildShoukakuTrackList.tracks.find(trk => trk.info.identifier === track.info.identifier);
                const resolved = await this.resolve(track as ILavalinkPayloadTrack);
                // @ts-expect-error silent error delete any
                Object.getOwnPropertyNames(validated).forEach(prop => delete validated[prop]); // eslint-disable-line
                Object.assign(validated!, resolved);
            };
        });
        return buildShoukakuTrackList;
    }

    public async fetchAppleToken(): Promise<void> {
        try {
            const textResponse = await petitio("https://music.apple.com/us/browse").text();
            const $ = load(textResponse);
            const token = JSON.parse(
                decodeURIComponent(
                    $("meta[name=desktop-music-app/config/environment]").attr("content")!
                )
            ) as AppleMusicMetaTagResponse;
            Object.defineProperty(this, "appleToken", { value: `Bearer ${token.MEDIA_API.token}` });
        } catch {
            /* Do nothing. */
        }
    }

    public async requestSpotifyToken(): Promise<void> {
        if (this.spotifyNextRequest) return;
        try {
            const request = await petitio("https://accounts.spotify.com/api/token", "POST").header({
                Authorization: `Basic ${this.shoukaku.client.utils.encodeDecodeBase64String(
                    `${this.pluginOptions.clientId!}:${this.pluginOptions.clientSecret!}`
                )}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }).body("grant_type=client_credentials")
                .send();

            if (request.statusCode === 400) return await Promise.reject(new Error("Invalid Spotify Client"));
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { access_token, token_type, expires_in }: { access_token: string; token_type: string; expires_in: number } = request.json();
            Object.defineProperty(this, "spotifyToken", { value: `${token_type} ${access_token}` });
            Object.defineProperty(this, "spotifyNextRequest", {
                configurable: true,
                value: setTimeout(() => {
                    delete this.spotifyNextRequest;
                    void this.requestSpotifyToken();
                }, expires_in * 1000)
            });
        } catch (e: any) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (e.statusCode === 400) return Promise.reject(new Error("Invalid Spotify client."));
            await this.requestSpotifyToken();
        }
    }


    public async getTracks(query: string, options?: LavalinkSource): Promise<ShoukakuTrackList> {
        const getHTTPQuery = query.slice(query.search("http") >= 0 ? query.search("http") : 0).split(" ")[0];
        if (this.appleRegex.test(getHTTPQuery)) {
            const regExpExec = this.appleRegex.exec(getHTTPQuery) as unknown as regExpExec;
            if (this.appleResolver.has(regExpExec.groups.type)) {
                try {
                    return await this.appleResolver.get(regExpExec.groups.type)?.fetch(regExpExec.groups.id);
                } catch (e) {
                    console.log(e);
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        } else if (this.deezerRegex.test(getHTTPQuery)) {
            const regExpExec = this.deezerRegex.exec(getHTTPQuery) as unknown as regExpExec;
            if (this.deezerResolver.has(regExpExec.groups.type)) {
                try {
                    return await this.deezerResolver.get(regExpExec.groups.type)?.fetch(regExpExec.groups.id);
                } catch {
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        }
        /*
         * else if (this.spotifyRegex.test(getHTTPQuery)) {
         *     const regExpExec = this.spotifyRegex.exec(getHTTPQuery) as unknown as regExpExec;
         *     if (this.spotifyResolver.has(regExpExec.groups.type)) {
         *         try {
         *             return await this.spotifyResolver.get(regExpExec.groups.type)?.fetch(regExpExec.groups.id);
         *         } catch {
         *             return this.buildResponse("LOAD_FAILED", []);
         *         }
         *     }
         * }
         */
        return this._getTracks(query, options);
    }
}

interface regExpExec {
    index: number;
    input: string;
    groups: {
        id: string;
        link: string;
        type: string;
    };
}
