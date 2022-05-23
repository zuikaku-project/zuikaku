import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, Track, SpotifyAlbum } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "album",
    category: "spotify"
})
export default class spotifyAlbumResolver extends ZuikakuPlugin {
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
            const spotifyAlbum: SpotifyAlbum = await petitio(
                `${this.plugin.spotifyBaseURL}/albums/${trackId}`,
                "GET"
            )
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const unresolvedSpotifyTracks = spotifyAlbum.tracks.items.map(
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
                        (spotifyAlbum.images[0]
                            ? spotifyAlbum.images[0].url
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
                    playlistName: spotifyAlbum.name
                });
            return this.plugin.buildResponse(
                "PLAYLIST_LOADED",
                unresolvedSpotifyTracks,
                { name: spotifyAlbum.name, selectedTrack: -1 }
            );
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
