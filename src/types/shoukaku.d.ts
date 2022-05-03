/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
export type Severity = "COMMON" | "FAULT" | "SUSPICIOUS";

export type LavalinkSource =
    | string
    | "bandcamp"
    | "local"
    | "soundcloud"
    | "twitch"
    | "vimeo"
    | "youtube";

export type LoadType =
    | "LOAD_FAILED"
    | "NO_MATCHES"
    | "PLAYLIST_LOADED"
    | "SEARCH_RESULT"
    | "TRACK_LOADED";

export interface LoadTrackResponse {
    loadType: LoadType;
    playlistInfo?: { name: string; selectedTrack: number };
    tracks: LavalinkTrack[];
    exception?: Omit<Exception, "cause">;
}

export interface LavalinkTrack {
    track: string;
    isrc?: string;
    info: {
        title: string;
        author: string;
        identifier: string;
        isStream: boolean;
        length: number;
        uri: string;
        artworkUrl: string;
        sourceName: LavalinkSource;
        position: number;
        isSeekable: boolean;
    };
}

export interface Exception {
    severity: Severity;
    message: string;
    cause: string;
}
