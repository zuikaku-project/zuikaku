import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "music-video",
    category: "apple"
})
export default class appleTrackResolver extends ZuikakuPlugin {
    public cache: Map<string, ShoukakuTrack> = new Map();
    public async fetch(trackId: string): Promise<ShoukakuTrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [this.cache.get(trackId)!]);
            }
            const request = await petitio(`${this.plugin.appleBaseURL}/music-videos/${trackId}`)
                .header("Authorization", this.plugin.appleToken)
                .send()
                .catch(() => null);
            if (!request || request.statusCode === 401) {
                await this.plugin.fetchAppleToken();
                return await this.fetch(trackId);
            }
            const data: AppleAPIResponse = request.json();
            if (data.errors || !data.data) {
                return this.plugin.buildResponse("LOAD_FAILED", []);
            }
            const appleTrack = data.data.filter(x => x.type === "music-videos")[0]!;
            appleTrack.attributes.id = appleTrack.id;
            const unresolvedAppleTrack = this.plugin.buildUnresolved(appleTrack.attributes);
            if (trackId) this.cache.set(trackId, unresolvedAppleTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [unresolvedAppleTrack]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}

interface AppleAPIResponse {
    errors?: unknown[];
    data?: {
        id: string;
        type?: "music-videos";
        attributes: {
            id: string;
            artistName: string;
            url: string;
            name: string;
            durationInMillis: number;
        };
    }[];
}
