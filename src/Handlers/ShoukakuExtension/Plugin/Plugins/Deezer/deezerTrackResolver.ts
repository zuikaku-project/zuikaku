import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, DeezerTrack } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "track",
    category: "deezer"
})
export default class deezerTrackResolver extends ZuikakuPlugin {
    public cache: Map<string, ShoukakuTrack> = new Map();
    public async fetch(trackId: string): Promise<ShoukakuTrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [this.cache.get(trackId)!]);
            }
            const deezerTrack: DeezerTrack = await petitio(`${this.plugin.deezerBaseURL}/track/${trackId}`).json();
            deezerTrack.duration = deezerTrack.duration! * 1000;
            const unresolvedTrack = this.plugin.buildUnresolved(deezerTrack);
            if (trackId) this.cache.set(trackId, unresolvedTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [unresolvedTrack]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
