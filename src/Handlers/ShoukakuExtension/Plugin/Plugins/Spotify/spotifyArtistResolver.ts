import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, Track, SpotifyArtist } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "artist",
    category: "spotify"
})
export default class spotifyArtistResolver extends ZuikakuPlugin {
    public cache: Map<string, { tracks: Track[]; playlistName: string }> =
        new Map();

    public async fetch(trackId: string): Promise<TrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse(
                    "PLAYLIST_LOADED",
                    this.cache.get(trackId)!.tracks,
                    {
                        name: this.cache.get(trackId)!.playlistName,
                        selectedTrack: -1
                    }
                );
            }
            const metaData: { name: string } = await petitio(
                `${this.plugin.baseUrl.spotify}/artists/${trackId}`
            )
                .header("Authorization", this.plugin.token.spotify)
                .json();
            const spotifyArtis: SpotifyArtist = await petitio(
                `${this.plugin.baseUrl.spotify}/artists/${trackId}/top-tracks`
            )
                .query("country", "US")
                .header("Authorization", this.plugin.token.spotify)
                .json();
            const unresolvedSpotifyTracks = spotifyArtis.tracks.map(
                spotifyTrack => {
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
                    return this.plugin.buildUnresolved({
                        isrc,
                        identifier,
                        author,
                        title,
                        uri,
                        length,
                        artworkUrl,
                        sourceName
                    });
                }
            );
            if (trackId)
                this.cache.set(trackId, {
                    tracks: unresolvedSpotifyTracks,
                    playlistName: metaData.name
                });
            return this.plugin.buildResponse(
                "PLAYLIST_LOADED",
                unresolvedSpotifyTracks,
                {
                    name: metaData.name,
                    selectedTrack: -1
                }
            );
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
