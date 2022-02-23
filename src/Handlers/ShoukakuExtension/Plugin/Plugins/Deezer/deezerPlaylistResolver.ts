import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, DeezerPlaylist } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "playlist",
    category: "deezer"
})
export default class deezerPlaylistResolver extends ZuikakuPlugin {
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
            const deezerPlaylist: DeezerPlaylist = await petitio(`${this.plugin.deezerBaseURL}/playlist/${trackId}`).json();
            const unresolvedDeezerTracks = deezerPlaylist.tracks.data.map(track => {
                track.duration = track.duration! * 1000;
                return this.plugin.buildUnresolved(track);
            });
            if (trackId) this.cache.set(trackId, { tracks: unresolvedDeezerTracks, playlistName: deezerPlaylist.title });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedDeezerTracks, { name: deezerPlaylist.title, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
