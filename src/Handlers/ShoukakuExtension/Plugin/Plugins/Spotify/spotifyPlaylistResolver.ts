import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, SpotifyPlaylist } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "playlist",
    category: "spotify"
})
export default class spotifyPlaylistResolver extends ZuikakuPlugin {
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
            const spotifyPlaylist: SpotifyPlaylist = await petitio(`${this.plugin.spotifyBaseURL}/playlists/${trackId}`)
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            let nextPage = spotifyPlaylist.tracks.next;
            let pageLoaded = 1;
            while (
                nextPage &&
                (this.plugin.pluginOptions.playlistLoadlimit === 0
                    ? true
                    : pageLoaded < this.plugin.pluginOptions.playlistLoadlimit!)
            ) {
                const spotifyPlaylistPage: SpotifyPlaylist["tracks"] = await petitio(nextPage)
                    .header("Authorization", this.plugin.spotifyToken)
                    .json();
                spotifyPlaylist.tracks.items.push(...spotifyPlaylistPage.items);
                nextPage = spotifyPlaylistPage.next;
                pageLoaded++;
            }
            const unresolvedSpotifyTracks = spotifyPlaylist.tracks.items
                .filter(x => x.track)
                .map(x => this.plugin.buildUnresolved(x.track!));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedSpotifyTracks, playlistName: spotifyPlaylist.name });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedSpotifyTracks, { name: spotifyPlaylist.name, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
