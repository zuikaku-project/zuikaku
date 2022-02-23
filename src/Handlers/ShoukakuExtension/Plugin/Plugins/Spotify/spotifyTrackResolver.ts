import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, SpotifyTrack } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "track",
    category: "spotify"
})
export default class spotifyTrackResolver extends ZuikakuPlugin {
    public cache: Map<string, ShoukakuTrack> = new Map();
    public async fetch(trackId: string): Promise<ShoukakuTrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [this.cache.get(trackId)!]);
            }
            const spotifyTrack: SpotifyTrack = await petitio(`${this.plugin.spotifyBaseURL}/tracks/${trackId}`)
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const unresolvedSpotifyTrack = this.plugin.buildUnresolved(spotifyTrack);
            if (trackId) this.cache.set(trackId, unresolvedSpotifyTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [unresolvedSpotifyTrack]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
