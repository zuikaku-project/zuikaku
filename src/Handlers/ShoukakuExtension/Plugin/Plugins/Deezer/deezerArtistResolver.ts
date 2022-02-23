import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, DeezerArtist, DeezerData } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "artist",
    category: "deezer"
})
export default class deezerArtistResolver extends ZuikakuPlugin {
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
            const deezerArtist: DeezerArtist = await petitio(`${this.plugin.deezerBaseURL}/artist/${trackId}`).json();
            const { data }: DeezerData = await petitio(`${this.plugin.deezerBaseURL}/artist/${trackId}/top?limit=50`).json();
            const unresolvedDeezerTracks = data.map(track => {
                track.duration = track.duration! * 1000;
                return this.plugin.buildUnresolved(track);
            });
            if (trackId) this.cache.set(trackId, { tracks: unresolvedDeezerTracks, playlistName: deezerArtist.name! });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedDeezerTracks, { name: deezerArtist.name!, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
