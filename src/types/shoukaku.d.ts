/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export type Severity = "COMMON" | "FAULT" | "SUSPICIOUS";

export type Source =
    | string
    | "bandcamp"
    | "local"
    | "soundcloud"
    | "twitch"
    | "vimeo"
    | "youtube";

export type Type =
    | "LOAD_FAILED"
    | "NO_MATCHES"
    | "PLAYLIST_LOADED"
    | "SEARCH_RESULT"
    | "TRACK_LOADED";

export interface Track {
    track: string;
    isrc?: string;
    info: {
        title?: string;
        author?: string;
        identifier?: string;
        isStream?: boolean;
        length?: number;
        uri?: string;
        artworkUrl?: string;
        sourceName?: Source;
        position?: number;
        isSeekable?: boolean;
    };
}

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
}

export interface Response {
    loadType: LoadType;
    tracks: Track[];
    playlistInfo?: {
        name?: string;
        selectedTrack?: number;
    };
    exception?: Omit<Exception, "cause">;
}

declare module "shoukaku" {
    export interface VoiceChannelOptions {
        textId?: string;
        voiceId?: string;
    }
}
