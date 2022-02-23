import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, SpotifyAlbum } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "album",
    category: "spotify"
})
export default class spotifyAlbumResolver extends ZuikakuPlugin {
    public cache: Map<string, { tracks: ShoukakuTrack[]; playlistName: string }> = new Map();
    public async fetch(trackId: string): Promise<ShoukakuTrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("PLAYLIST_LOADED",
                    this.cache.get(trackId)!.tracks,
                    {
                        name: this.cache.get(trackId)!.playlistName,
                        selectedTrack: -1
                    });
            }
            const spotifyAlbum: SpotifyAlbum = await petitio(`${this.plugin.spotifyBaseURL}/albums/${trackId}`, "GET").header("Authorization", this.plugin.spotifyToken).json();
            const unresolvedSpotifyTracks = spotifyAlbum.tracks.items.map(track => this.plugin.buildUnresolved(track));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedSpotifyTracks, playlistName: spotifyAlbum.name });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedSpotifyTracks, { name: spotifyAlbum.name, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
