import {
    AppleMusicMetaTagResponse,
    IPluginComponent,
    IPluginOptions,
    IregExpExec,
    LavalinkSource,
    LavalinkTrack
} from "@zuikaku/types";
import { Utils } from "@zuikaku/Utils";
import { load } from "cheerio";
import { Collection } from "discord.js";
import { join, resolve } from "node:path";
import petitio from "petitio";
import { ShoukakuSocket } from "shoukaku";
import { ShoukakuHandler, TrackList } from "..";

export class PluginManager {
    public headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    };

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

    private readonly _getTracks!: (
        query: string,
        options?: LavalinkSource
    ) => Promise<TrackList>;

    private spotifyNextRequest?: NodeJS.Timeout;

    public constructor(
        public shoukaku: ShoukakuHandler,
        public pluginOptions: IPluginOptions
    ) {
        Object.defineProperty(this, "_getTracks", {
            value: this.shoukaku.getTracks.bind(this.shoukaku)
        });
        Object.defineProperty(this, "appleRegex", {
            value: /(?<link>(?:https:\/\/music\.apple\.com\/)(?:.+)?(?<type>artist|album|music-video|playlist)\/(?<title>[\w\-.]\/[\w\-.]+|[^&]+)\/(?<id>[\w\-.]\/[\w\-.]+|[^&]+))/
        });
        Object.defineProperty(this, "deezerRegex", {
            value: /(?<link>(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist|artist)\/(?<id>\d+))/
        });
        Object.defineProperty(this, "spotifyRegex", {
            value: /(?<link>(?:https:\/\/open\.spotify\.com\/(?:user\/[A-Za-z0-9]+\/)?|spotify:)(?<type>album|playlist|track|artist|episode|show)(?:[/:])(?<id>[A-Za-z0-9]+).*$)/
        });
        Object.defineProperty(this, "appleBaseURL", {
            value: "https://amp-api.music.apple.com/v1/catalog/us"
        });
        Object.defineProperty(this, "deezerBaseURL", {
            value: "https://api.deezer.com"
        });
        Object.defineProperty(this, "spotifyBaseURL", {
            value: "https://api.spotify.com/v1"
        });
        Object.defineProperty(this, "appleToken", {
            value: null,
            configurable: true
        });
        Object.defineProperty(this, "spotifyToken", {
            value: null,
            configurable: true
        });
        Object.defineProperty(this, "appleResolver", {
            value: new Collection(),
            configurable: true,
            enumerable: true
        });
        Object.defineProperty(this, "deezerResolver", {
            value: new Collection(),
            configurable: true,
            enumerable: true
        });
        Object.defineProperty(this, "spotifyResolver", {
            value: new Collection(),
            configurable: true,
            enumerable: true
        });
    }

    public async _init(): Promise<void> {
        this.shoukaku.getTracks = this.getTracks.bind(this);
        await this.fetchAppleToken();
        await this.requestSpotifyToken();
        await this._loadPluginResolver();
    }

    public async _loadPluginResolver(): Promise<void> {
        const getPluginFile = this.shoukaku.client.utils.readdirRecursive(
            join(__dirname, "./Plugins")
        );
        for (const pluginFile of getPluginFile) {
            const plugin =
                await this.shoukaku.client.utils.import<IPluginComponent>(
                    resolve(pluginFile),
                    this
                );
            if (plugin === undefined) {
                console.log(plugin, pluginFile);
                continue;
            }
            if (plugin.meta.category === "apple")
                this.appleResolver.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "deezer")
                this.deezerResolver.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "spotify")
                this.spotifyResolver.set(plugin.meta.name, plugin);
        }
    }

    public getNode(query?: string[] | string): ShoukakuSocket {
        return this.shoukaku.getNode(query);
    }

    public buildUnresolved({
        isrc,
        identifier,
        author,
        title,
        uri,
        length,
        artworkUrl,
        sourceName
    }: {
        isrc: string;
        identifier: string;
        author: string;
        title: string;
        uri: string;
        length: number;
        artworkUrl: string;
        sourceName: LavalinkSource;
    }): LavalinkTrack {
        return {
            track: "",
            isrc,
            info: {
                identifier,
                author,
                title,
                uri,
                length,
                artworkUrl,
                isStream: false,
                isSeekable: true,
                sourceName,
                position: 0
            }
        };
    }

    public buildResponse(
        loadType: "LOAD_FAILED" | "NO_MATCHES",
        tracks: []
    ): TrackList;
    public buildResponse(
        loadType: "SEARCH_RESULT" | "TRACK_LOADED",
        tracks: LavalinkTrack[]
    ): TrackList;
    public buildResponse(
        loadType: "PLAYLIST_LOADED",
        tracks: LavalinkTrack[],
        playlistInfo: { name: string; selectedTrack: number }
    ): TrackList;
    public buildResponse(
        loadType:
            | "LOAD_FAILED"
            | "NO_MATCHES"
            | "PLAYLIST_LOADED"
            | "SEARCH_RESULT"
            | "TRACK_LOADED",
        tracks: LavalinkTrack[] = [],
        playlistInfo?: { name: string; selectedTrack: number }
    ): TrackList {
        const buildTrackList = new TrackList({
            loadType,
            tracks,
            playlistInfo
        });
        return buildTrackList;
    }

    public async fetchAppleToken(): Promise<void> {
        try {
            const textResponse = await petitio(
                "https://music.apple.com/us/browse"
            ).text();
            const $ = load(textResponse);
            const token = JSON.parse(
                decodeURIComponent(
                    $("meta[name=desktop-music-app/config/environment]").attr(
                        "content"
                    )!
                )
            ) as AppleMusicMetaTagResponse;
            Object.defineProperty(this, "appleToken", {
                value: `Bearer ${token.MEDIA_API.token}`
            });
        } catch {
            /* Do nothing. */
        }
    }

    public async requestSpotifyToken(): Promise<void> {
        if (this.spotifyNextRequest) return;
        try {
            const request = await petitio(
                "https://accounts.spotify.com/api/token",
                "POST"
            )
                .header({
                    Authorization: `Basic ${Utils.encodeDecodeBase64String(
                        `${this.pluginOptions.clientId!}:${this.pluginOptions
                            .clientSecret!}`
                    )}`,
                    "Content-Type": "application/x-www-form-urlencoded"
                })
                .body("grant_type=client_credentials")
                .send();

            if (request.statusCode === 400)
                return await Promise.reject(
                    new Error("Invalid Spotify Client")
                );
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const {
                access_token,
                token_type,
                expires_in
            }: {
                access_token: string;
                token_type: string;
                expires_in: number;
            } = request.json();
            Object.defineProperty(this, "spotifyToken", {
                value: `${token_type} ${access_token}`
            });
            Object.defineProperty(this, "spotifyNextRequest", {
                configurable: true,
                value: setTimeout(() => {
                    delete this.spotifyNextRequest;
                    void this.requestSpotifyToken();
                }, expires_in * 1000)
            });
        } catch (e: any) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (e.statusCode === 400)
                return Promise.reject(new Error("Invalid Spotify client."));
            await this.requestSpotifyToken();
        }
    }

    public async getTracks(
        query: string,
        options?: LavalinkSource
    ): Promise<TrackList> {
        const getHTTPQuery = query
            .slice(query.search("http") >= 0 ? query.search("http") : 0)
            .split(" ")[0];
        if (this.appleRegex.test(getHTTPQuery)) {
            const regExpExec = this.appleRegex.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.appleResolver.has(regExpExec.groups.type)) {
                try {
                    return await this.appleResolver
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch (e) {
                    console.log(e);
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        } else if (this.deezerRegex.test(getHTTPQuery)) {
            const regExpExec = this.deezerRegex.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.deezerResolver.has(regExpExec.groups.type)) {
                try {
                    return await this.deezerResolver
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch {
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        } else if (this.spotifyRegex.test(getHTTPQuery)) {
            const regExpExec = this.spotifyRegex.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.spotifyResolver.has(regExpExec.groups.type)) {
                try {
                    return await this.spotifyResolver
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch {
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        }
        return this._getTracks(query, options);
    }
}
