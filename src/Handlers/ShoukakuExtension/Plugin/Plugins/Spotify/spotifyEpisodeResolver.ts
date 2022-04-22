import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { TrackList } from "@zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, LavalinkTrack, SpotifyEpisode } from "@zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "episode",
    category: "spotify"
})
export default class spotifyEpisodeResolver extends ZuikakuPlugin {
    public cache: Map<string, LavalinkTrack> = new Map();
    public async fetch(trackId: string): Promise<TrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [this.cache.get(trackId)!]);
            }
            const spotifyEpisode: SpotifyEpisode = await petitio(`${this.plugin.spotifyBaseURL}/episodes/${trackId}`, "GET")
                .query("market", "US")
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const isrc = "";
            const identifier = spotifyEpisode.id;
            const author = spotifyEpisode.show.publisher;
            const title = spotifyEpisode.name;
            const uri = spotifyEpisode.external_urls.spotify;
            const length = spotifyEpisode.duration_ms;
            const artworkUrl = spotifyEpisode.images[0].url;
            const sourceName = "spotify";
            const unresolvedSpotifyTrack = this.plugin.buildUnresolved({ isrc, identifier, author, title, uri, length, artworkUrl, sourceName });
            if (trackId) this.cache.set(trackId, unresolvedSpotifyTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [unresolvedSpotifyTrack]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
