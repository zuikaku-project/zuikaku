/* eslint-disable @typescript-eslint/method-signature-style */
/* eslint-disable @typescript-eslint/naming-convention */
export interface IPluginOptions {
    clientId?: string;
    clientSecret?: string;
    usePluginMetadata?: boolean;
    playlistLoadlimit?: number;
}

export interface ILavalinkPayloadTrack {
    track: string;
    info: {
        author?: string;
        title?: string;
        uri?: string;
        identifier?: string;
        length?: number;
    };
}

export interface ILavalinkPayloadTrackList {
    loadType: "LOAD_FAILED" | "NO_MATCHES" | "PLAYLIST_LOADED" | "SEARCH_RESULT" | "TRACK_LOADED";
    playlistInfo?: {
        name?: string;
        selectedTrack?: number;
    };
    tracks: ILavalinkPayloadTrack[];
}

export interface AppleMusicMetaTagResponse {
    MEDIA_API: {
        token: string;
    };
}

export interface DeezerData {
    data: DeezerTrack[];
}

export interface ArtistsEntity {
    external_urls: ExternalUrls;
    href: string;
    id: string;
    name: string;
    type: string;
    uri: string;
}

export interface ExternalUrls {
    spotify: string;
}

export interface AppleTracks {
    id?: string;
    url?: string;
    name?: string;
    artistName?: string;
    durationInMillis?: number;
}

export interface DeezerTrack {
    id?: string;
    link?: string;
    title?: string;
    artist?: DeezerArtist;
    duration?: number;
}

export interface SpotifyTrack {
    id?: string;
    name?: string;
    artists?: ArtistsEntity[] | null;
    duration_ms?: number;
    external_urls?: { spotify: string };
}

export interface DeezerArtist {
    id?: number;
    name?: string;
    tracklist?: string;
    type?: string;
}

export interface SpotifyArtist {
    tracks: SpotifyTrack[];
}

export interface DeezerPlaylist {
    creator: DeezerArtist;
    title: string;
    tracks: {
        data: DeezerTrack[];
        checksum: string;
    };
}

export interface SpotifyPlaylist {
    name: string;
    tracks: {
        items: { track?: SpotifyTrack | null }[];
        next: string | null;
        previous: string | null;
    };
}

export interface DeezerAlbum {
    artist: DeezerArtist;
    title: string;
    tracks: {
        data: DeezerTrack[];
    };
}

export interface SpotifyAlbum {
    artists: SpotifyArtist[];
    name: string;
    tracks: {
        items: SpotifyTrack[];
        next: string | null;
        previous: string | null;
    };
}

export interface SpotifyEpisode {
    external_urls: {
        spotify: string;
    };
    id: string;
    name: string;
    show: {
        id: string;
        name: string;
        external_urls: {
            spotify: string;
        };
    };
}

export interface SpotifyShow {
    episodes: {
        items: {
            name: string;
            external_urls: {
                spotify: string;
            };
            id: string;
            duration_ms: number;
            artist: null | undefined;
        }[];
        next: string | null;
        previous: string | null;
    };
    external_urls: {
        spotify: string;
    };
    id: string;
    name: string;
}