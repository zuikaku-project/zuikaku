import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { DeezerAlbum, IPluginComponent, Track } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "album",
    category: "deezer"
})
export default class deezerAlbumResolver extends ZuikakuPlugin {
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
            const deezerAlbum: DeezerAlbum = await petitio(
                `${this.plugin.deezerBaseURL}/album/${trackId}`,
                "GET"
            ).json();
            const unresolvedDeezerTracks = deezerAlbum.tracks.data.map(
                deezerTrack => {
                    const isrc = deezerTrack.isrc ?? "";
                    const identifier = deezerTrack.id ?? "";
                    const author = deezerTrack.artist?.name ?? "";
                    const title = deezerTrack.title ?? "";
                    const uri = deezerTrack.link ?? "";
                    const length = deezerTrack.duration! * 1000;
                    const artworkUrl = deezerTrack.md5_image
                        ? `https://e-cdns-images.dzcdn.net/images/cover/${deezerTrack.md5_image}/1000x1000-000000-80-0-0.jpg`
                        : "";
                    const sourceName = "deezer";
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
                    tracks: unresolvedDeezerTracks,
                    playlistName: deezerAlbum.title
                });
            return this.plugin.buildResponse(
                "PLAYLIST_LOADED",
                unresolvedDeezerTracks,
                { name: deezerAlbum.title, selectedTrack: -1 }
            );
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
