import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "artist",
    category: "apple"
})
export default class appleArtistResolver extends ZuikakuPlugin {
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
            const request = await petitio(`${this.plugin.appleBaseURL}/artists/${trackId}?views=top-songs`)
                .header("Authorization", this.plugin.appleToken)
                .send()
                .catch(() => null);
            if (!request || request.statusCode === 401) {
                await this.plugin.fetchAppleToken();
                return await this.fetch(trackId);
            }
            const data: AppleAPIResponse = request.json();
            if (data.errors || !data.data) {
                console.log(data);
                return this.plugin.buildResponse("LOAD_FAILED", []);
            }
            const appleArtist = data.data.filter(x => x.type === "artists")[0]!;
            const playlistName = appleArtist.attributes.name;
            const filterData = appleArtist.views["top-songs"].data.filter(x => x.type === "songs");
            while (data.data[0].views["top-songs"].next) {
                const nextData: AppleMusicPaginationTrack = await petitio(
                    `${this.plugin.appleBaseURL}/${data.data[0].views["top-songs"].next.split("/").slice(4).join("/")}`
                )
                    .header("Authorization", this.plugin.appleToken)
                    .json();
                data.data[0].views["top-songs"].next = nextData.next;
                filterData.push(...nextData.data.filter(x => x.type === "songs"));
            }
            filterData.map(x => x.attributes.id = x.id);
            const unresolvedAppleTrack = filterData.map(x => this.plugin.buildUnresolved(x.attributes));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedAppleTrack, playlistName });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedAppleTrack, { name: playlistName, selectedTrack: -1 });
        } catch (e) {
            console.log(e);
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}

interface AppleAPIResponse {
    errors?: unknown[];
    data?: {
        id: string;
        type?: "artists";
        attributes: {
            name: string;
        };
        views: {
            "top-songs": {
                next?: string;
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

interface AppleMusicPaginationTrack {
    next?: string;
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
}
