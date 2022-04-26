import { ISpotifyLyrics } from "@zuikaku/types";

export class Lyrics {
    public trackName = this.raw?.trackName;
    public trackArtist = this.raw?.trackArtist;
    public trackId = this.raw?.trackId;
    public trackUrl = this.raw?.trackUrl;
    public imageUrl = this.raw?.imageUrl;
    public language = this.raw?.language;
    public lyrics = this.raw?.lyrics;
    public constructor(public readonly raw?: ISpotifyLyrics) {}
}
