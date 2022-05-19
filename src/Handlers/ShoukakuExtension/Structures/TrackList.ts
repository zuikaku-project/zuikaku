import { LoadTrackResponse } from "#zuikaku/types";
import { Track } from "./Track";

const Types = {
    PLAYLIST_LOADED: "PLAYLIST",
    TRACK_LOADED: "TRACK",
    SEARCH_RESULT: "SEARCH",
    NO_MATCHES: "NO_MATCHES",
    LOAD_FAILED: "LOAD_FAILED"
};

export class TrackList {
    public type = Types[this.raw.loadType as keyof typeof Types];
    public playlistName =
        this.type === Types.PLAYLIST_LOADED
            ? this.raw.playlistInfo!.name
            : null;

    public selectedTrack =
        this.type === Types.PLAYLIST_LOADED
            ? this.raw.playlistInfo!.selectedTrack
            : null;

    public tracks = this.raw.tracks.map(d => new Track(d));
    public exception =
        this.type === Types.LOAD_FAILED ? this.raw.exception : null;

    public constructor(public readonly raw: LoadTrackResponse) {}
}
