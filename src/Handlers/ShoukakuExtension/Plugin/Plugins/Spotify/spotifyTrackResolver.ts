import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, Track, SpotifyTrack } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "track",
    category: "spotify"
})
export default class spotifyTrackResolver extends ZuikakuPlugin {
    public cache: Map<string, Track> = new Map();
    public async fetch(trackId: string): Promise<TrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [
                    this.cache.get(trackId)!
                ]);
            }
            const spotifyTrack: SpotifyTrack = await petitio(
                `${this.plugin.baseUrl.spotify}/tracks/${trackId}`
            )
                .header("Authorization", this.plugin.token.spotify)
                .json();
            const isrc = spotifyTrack.external_ids?.isrc ?? "";
            const identifier = spotifyTrack.id ?? "";
            const author =
                (spotifyTrack.artists
                    ? spotifyTrack.artists[0].name
                    : undefined) ?? "";
            const title = spotifyTrack.name ?? "";
            const uri = spotifyTrack.external_urls?.spotify ?? "";
            const length = spotifyTrack.duration_ms ?? 0;
            const artworkUrl =
                (spotifyTrack.album?.images[0]
                    ? spotifyTrack.album.images[0].url
                    : undefined) ?? "";
            const sourceName = "spotify";
            const unresolvedSpotifyTrack = this.plugin.buildUnresolved({
                isrc,
                identifier,
                author,
                title,
                uri,
                length,
                artworkUrl,
                sourceName
            });
            if (trackId) this.cache.set(trackId, unresolvedSpotifyTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [
                unresolvedSpotifyTrack
            ]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
