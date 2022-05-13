/* eslint-disable max-lines */
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import {
    ApplicationCommandOptionData,
    ApplicationCommandOptionType,
    PermissionResolvable,
    Snowflake,
    User
} from "discord.js";
import { Request, Response } from "express";
import { UnresolvedPluginTrack } from "./plugin";

export type MessageInteractionAction = "editReply" | "followUp" | "reply";

export interface IConfig {
    token: {
        production: string;
        development: string;
    };
    devMode: boolean;
    devGuild: string[];
    api: {
        port: number;
        canvas: {
            auth: string;
            url: string;
            secure?: boolean;
        };
        dbl: string;
        weeby: string;
        spotify: {
            clientId: string;
            clientSecret: string;
        };
        cookie: {
            instagram: string;
        };
    };
    nodes: {
        auth: string;
        group?: string;
        url: string;
        name: string;
        secure?: boolean;
    }[];
    mongodb: {
        url: string;
        dbName: {
            production: string;
            development: string;
        };
    };
}

export interface IChangelog {
    date: Date;
    title: string;
    content: string[];
}

export interface decodeBase64String {
    url?: string;
    amount?: string;
    query?: string;
    dark?: boolean;
    songName?: string;
    album?: string;
    author?: string;
    start?: number;
    end?: number;
    noTime?: boolean;
    spotifyImage?: string;
    fullName?: string;
    userIg?: string;
    bio?: string;
    post?: number;
    follower?: number;
    following?: number;
    isPrivate?: boolean;
    profilePic?: string;
    isVerified?: boolean;
}

export interface IInstagram {
    graphql:
        | {
              user: {
                  biography: string | null;
                  edge_follow: {
                      count: number;
                  };
                  edge_followed_by: {
                      count: number;
                  };
                  edge_owner_to_timeline_media: {
                      count: number;
                  };
                  full_name: string;
                  is_private: boolean;
                  is_verified: boolean;
                  profile_pic_url_hd: string;
                  username: string;
              };
          }
        | undefined;
}

export interface IMusixmatch {
    title?: string;
    artists?: string;
    lyrics?: string;
    albumImg?: string;
    url?: string;
}

interface ISpotifyLyrics {
    trackName: string | null;
    trackArtist: string | null;
    trackId: string | null;
    trackUrl: string | null;
    imageUrl: string | null;
    language: string | null;
    lyrics: string[] | null;
}

export interface INPMSearchAPI {
    objects: {
        package: {
            name?: string;
            scope?: string;
            version?: string;
            description?: string;
            keywords?: string[];
            date?: Date;
            links?: {
                npm?: string;
                homepage?: string;
                repository?: string;
                bugs?: string;
            };
            publisher?: {
                username?: string;
                email?: string;
            };
            maintainers?: {
                username?: string;
                email?: string;
            }[];
            score?: {
                final?: number;
                detail?: {
                    quality?: number;
                    popularity?: number;
                    maintenance?: number;
                };
            };
            searchScore?: number;
        };
    }[];
}

export interface INPMRegistryAPI {
    _id: string;
    _rev: string;
    name: string;
    description?: string;
    "dist-tags": { latest: string };
    versions: {
        name: string;
        version: string;
        homepage?: string;
        repository?: INPMRegistryAPI["repository"];
        bugs?: INPMRegistryAPI["bugs"];
        license?: string;
        readme?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        readmeFilename: string;
        _id: string;
        description?: string;
        dist: {
            integrity: string;
            shasum: string;
            tarball: string;
            fileCount: number;
            unpackedSize: number;
        };
        _npmVersion: string;
        _npmUser: INPMRegistryAPI["author"];
        maintainers: INPMRegistryAPI["author"][];
    }[];
    time: { created: Date; modified: Date };
    author?: { name?: string; email?: string; url?: string };
    repository?: { type: string; url: string };
    bugs?: { url: string };
    readme: string;
}

export interface ISnipe {
    date: string;
    author: User;
    content: string;
    attachments: string[];
}

export interface IListenerComponent {
    meta: {
        name: string;
        event: string;
        emitter: string;
        readonly path?: string;
    };
    execute: (...args: any) => void;
}

export interface ICommandComponent {
    meta: {
        readonly path?: string;
        readonly category?: string;
        name: string;
        description?: string;
        usage?: string;
        slash?: SlashOption;
        cooldown?: number;
        disable?: boolean;
        devOnly?: boolean;
        contextChat?: string;
        clientPermissions?: PermissionResolvable;
        userPermissions?: PermissionResolvable;
    };
    execute: (ctx: CommandContext, ...args: any) => Promise<void>;
}

export interface IRouterComponent {
    meta: {
        name: string;
        method: "delete" | "get" | "patch" | "post" | "put";
        path: string;
        callback?: ((
            request: Request,
            response: Response,
            next: () => void
        ) => any)[];
    };
    execute: (req: Request, res: Response) => void;
}

export interface IPluginComponent {
    meta: {
        category: string;
        name: string;
    };
    fetch: (trackId: string) => Promise<UnresolvedPluginTrack>;
}

export interface ICategoryMeta {
    name: string;
    hide: boolean;
    cmds: Collection<string, ICommandComponent>;
}

export interface SlashOption extends ApplicationCommandOptionData {
    name?: string;
    description?: string;
    type?: ApplicationCommandOptionType;
    options?: ApplicationCommandOptionData[];
}

export interface QueueOptions {
    guildId?: string;
    textChannelId?: string;
    voiceChannelId?: string;
}

declare module "discord.js" {
    export interface Client {
        readonly ownerId: Snowflake[];
    }
    export interface ClientOptions {
        ownerId: Snowflake[];
    }
    export interface Guild {
        client: ZuikakuClient;
    }
    export interface CommandInteraction {
        author: User;
        client: ZuikakuClient;
    }
    export interface Message {
        client: ZuikakuClient;
        deleteReply: () => Promise<void>;
    }
    export interface TextChannel {
        activateCollector: boolean;
    }
    export interface NewsChannel {
        activateCollector: boolean;
    }
    export interface DMChannel {
        activateCollector: boolean;
    }
    export interface ThreadChannel {
        activateCollector: boolean;
    }
}

declare module "shoukaku" {
    export interface ShoukakuTrack {
        isrc?: string;
    }

    export interface JoinOptions {
        textId?: string;
        voiceId?: string;
    }
}
