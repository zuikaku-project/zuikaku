import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, Track, SpotifyPlaylist } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "playlist",
    category: "spotify"
})
export default class spotifyPlaylistResolver extends ZuikakuPlugin {
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
            const spotifyPlaylist: SpotifyPlaylist = await petitio(
                `${this.plugin.baseUrl.spotify}/playlists/${trackId}`
            )
                .header("Authorization", this.plugin.token.spotify)
                .json();
            let nextPage = spotifyPlaylist.tracks.next;
            let pageLoaded = 1;
            while (
                nextPage &&
                (this.plugin.pluginOptions.playlistLoadlimit === 0
                    ? true
                    : pageLoaded < this.plugin.pluginOptions.playlistLoadlimit!)
            ) {
                const spotifyPlaylistPage: SpotifyPlaylist["tracks"] =
                    await petitio(nextPage)
                        .header("Authorization", this.plugin.token.spotify)
                        .json();
                spotifyPlaylist.tracks.items.push(...spotifyPlaylistPage.items);
                nextPage = spotifyPlaylistPage.next;
                pageLoaded++;
            }
            const unresolvedSpotifyTracks = spotifyPlaylist.tracks.items
                .filter(spotifyTrack => spotifyTrack.track)
                .map(spotifyTrack => {
                    const isrc = spotifyTrack.track?.external_ids?.isrc ?? "";
                    const identifier = spotifyTrack.track?.id ?? "";
                    const author =
                        (spotifyTrack.track?.artists
                            ? spotifyTrack.track.artists[0].name
                            : undefined) ?? "";
                    const title = spotifyTrack.track?.name ?? "";
                    const uri =
                        spotifyTrack.track?.external_urls?.spotify ?? "";
                    const length = spotifyTrack.track?.duration_ms ?? 0;
                    const artworkUrl =
                        (spotifyTrack.track?.album?.images[0]
                            ? spotifyTrack.track.album.images[0].url
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
                });
            if (trackId)
                this.cache.set(trackId, {
                    tracks: unresolvedSpotifyTracks,
                    playlistName: spotifyPlaylist.name
                });
            return this.plugin.buildResponse(
                "PLAYLIST_LOADED",
                unresolvedSpotifyTracks,
                { name: spotifyPlaylist.name, selectedTrack: -1 }
            );
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
