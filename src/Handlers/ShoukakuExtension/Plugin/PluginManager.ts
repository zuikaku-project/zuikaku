import {
    AppleMusicMetaTagResponse,
    IPluginComponent,
    IPluginOptions,
    IregExpExec,
    Source,
    Track
} from "#zuikaku/types";
import { Utils } from "#zuikaku/Utils";
import { load } from "cheerio";
import { Collection } from "discord.js";
import { join, resolve } from "node:path";
import petitio from "petitio";
import { Node } from "shoukaku";
import { ShoukakuHandler, TrackList } from "..";

export class PluginManager {
    public headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
    };

    public readonly regex!: Record<"apple" | "deezer" | "spotify", RegExp>;
    public readonly baseUrl!: Record<"apple" | "deezer" | "spotify", string>;
    public readonly token!: Record<"apple" | "spotify", string>;
    public readonly resolver!: Record<
        "apple" | "deezer" | "spotify",
        Collection<string, IPluginComponent>
    >;

    private readonly _getTracks!: (
        query: string,
        options?: Source
    ) => Promise<TrackList>;

    private spotifyNextRequest?: NodeJS.Timeout;

    public constructor(
        public shoukaku: ShoukakuHandler,
        public pluginOptions: IPluginOptions
    ) {
        Object.defineProperties(this, {
            _getTracks: {
                value: this.shoukaku.getTracks.bind(this.shoukaku),
                enumerable: true
            },
            regex: {
                value: {
                    apple: /(?<link>(?:https:\/\/music\.apple\.com\/)(?:.+)?(?<type>artist|album|music-video|playlist)\/(?<title>[\w\-.]\/[\w\-.]+|[^&]+)\/(?<id>[\w\-.]\/[\w\-.]+|[^&]+))/,
                    deezer: /(?<link>(?:https?:\/\/|)?(?:www\.)?deezer\.com\/(?:\w{2}\/)?(?<type>track|album|playlist|artist)\/(?<id>\d+))/,
                    spotify:
                        /(?<link>(?:https:\/\/open\.spotify\.com\/(?:user\/[A-Za-z0-9]+\/)?|spotify:)(?<type>album|playlist|track|artist|episode|show)(?:[/:])(?<id>[A-Za-z0-9]+).*$)/
                },
                enumerable: true
            },
            baseUrl: {
                value: {
                    apple: "https://amp-api.music.apple.com/v1/catalog/us",
                    deezer: "https://api.deezer.com",
                    spotify: "https://api.spotify.com/v1"
                },
                enumerable: true
            },
            token: {
                value: {
                    apple: null,
                    spotify: null
                },
                configurable: true
            },
            resolver: {
                value: {
                    apple: new Collection(),
                    deezer: new Collection(),
                    spotify: new Collection()
                },
                enumerable: true
            }
        });
    }

    public async _init(): Promise<void> {
        this.shoukaku.getTracks = this.getTracks.bind(this);
        await this.fetchAppleToken();
        await this.requestSpotifyToken();
        await this._loadPluginResolver();
    }

    public getNode(query?: string[] | string): Node | undefined {
        return this.shoukaku.getNode(query ?? "auto");
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
        sourceName: Source;
    }): Track {
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
        tracks: Track[]
    ): TrackList;
    public buildResponse(
        loadType: "PLAYLIST_LOADED",
        tracks: Track[],
        playlistInfo?: { name?: string; selectedTrack: number }
    ): TrackList;
    public buildResponse(
        loadType:
            | "LOAD_FAILED"
            | "NO_MATCHES"
            | "PLAYLIST_LOADED"
            | "SEARCH_RESULT"
            | "TRACK_LOADED",
        tracks: Track[] = [],
        playlistInfo?: { name?: string; selectedTrack?: number }
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
            this.token.apple = `Bearer ${token.MEDIA_API.token}`;
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
            this.token.spotify = `${token_type} ${access_token}`;
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
        options?: Source
    ): Promise<TrackList> {
        const getHTTPQuery = query
            .slice(query.search("http") >= 0 ? query.search("http") : 0)
            .split(" ")[0];
        if (this.regex.apple.test(getHTTPQuery)) {
            const regExpExec = this.regex.apple.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.resolver.apple.has(regExpExec.groups.type)) {
                try {
                    return await this.resolver.apple
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch (e) {
                    console.log(e);
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        } else if (this.regex.deezer.test(getHTTPQuery)) {
            const regExpExec = this.regex.deezer.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.resolver.deezer.has(regExpExec.groups.type)) {
                try {
                    return await this.resolver.deezer
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch {
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        } else if (this.regex.spotify.test(getHTTPQuery)) {
            const regExpExec = this.regex.spotify.exec(
                getHTTPQuery
            ) as unknown as IregExpExec;
            if (this.resolver.spotify.has(regExpExec.groups.type)) {
                try {
                    return await this.resolver.spotify
                        .get(regExpExec.groups.type)
                        ?.fetch(regExpExec.groups.id);
                } catch {
                    return this.buildResponse("LOAD_FAILED", []);
                }
            }
        }
        return this._getTracks(query, options);
    }

    private async _loadPluginResolver(): Promise<void> {
        const getPluginFile = Utils.readdirRecursive(
            join(Utils.importURLToString(import.meta.url), "./Plugins")
        );
        for (const pluginFile of getPluginFile) {
            const plugin = await Utils.import<IPluginComponent>(
                resolve(pluginFile),
                this
            );
            if (plugin === undefined) {
                console.log(plugin, pluginFile);
                continue;
            }
            if (plugin.meta.category === "apple")
                this.resolver.apple.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "deezer")
                this.resolver.deezer.set(plugin.meta.name, plugin);
            if (plugin.meta.category === "spotify")
                this.resolver.spotify.set(plugin.meta.name, plugin);
        }
    }
}
