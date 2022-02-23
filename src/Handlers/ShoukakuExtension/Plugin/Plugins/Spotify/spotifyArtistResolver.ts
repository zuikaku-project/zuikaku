import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, SpotifyArtist } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "artist",
    category: "spotify"
})
export default class spotifyArtistResolver extends ZuikakuPlugin {
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
            const metaData: { name: string } = await petitio(`${this.plugin.spotifyBaseURL}/artists/${trackId}`)
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const spotifyArtis: SpotifyArtist = await petitio(`${this.plugin.spotifyBaseURL}/artists/${trackId}/top-tracks`)
                .query("country", "US")
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const unresolvedSpotifyTracks = spotifyArtis.tracks.map(track => this.plugin.buildUnresolved(track));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedSpotifyTracks, playlistName: metaData.name });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedSpotifyTracks, { name: metaData.name, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
