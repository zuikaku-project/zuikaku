import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "album",
    category: "apple"
})
export default class appleAlbumResolver extends ZuikakuPlugin {
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
            const request = await petitio(`${this.plugin.appleBaseURL}/albums/${trackId}`)
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
            const appleAlbum = data.data.filter(x => x.type === "albums")[0]!;
            const playlistName = appleAlbum.attributes.name;
            const filterData = appleAlbum.relationships.tracks.data.filter(x => x.type === "songs");
            filterData.map(x => x.attributes.id = x.id);
            const unresolvedAppleTrack = filterData.map(x => this.plugin.buildUnresolved(x.attributes));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedAppleTrack, playlistName });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedAppleTrack, { name: playlistName, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}

interface AppleAPIResponse {
    errors?: unknown[];
    data?: {
        id: string;
        type?: "albums";
        attributes: {
            name: string;
        };
        relationships: {
            tracks: {
                data: {
                    id: string;
                    type?: "songs";
                    attributes: {
                        id: string;
                        artistName: string;
                        url: string;
                        name: string;
                        durationInMillis: number;
                    };
                }[];
            };
        };
    }[];
}
