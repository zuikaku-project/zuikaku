import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { ZuikakuPlugin } from "@zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, SpotifyEpisode, SpotifyShow } from "@zuikaku/types";
import petitio from "petitio";
import { ShoukakuTrack, ShoukakuTrackList } from "shoukaku";

@ZuikakuDecorator<IPluginComponent>({
    name: "episode",
    category: "spotify"
})
export default class spotifyEpisodeResolver extends ZuikakuPlugin {
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
            const metaData: SpotifyEpisode = await petitio(`${this.plugin.spotifyBaseURL}/episodes/${trackId}`, "GET")
                .query("market", "US")
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            const spotifyShow: SpotifyShow = await petitio(`${this.plugin.spotifyBaseURL}/shows/${metaData.show.id}`)
                .query("market", "US")
                .header("Authorization", this.plugin.spotifyToken)
                .json();
            let nextPage = spotifyShow.episodes.next;
            let pageLoaded = 1;
            while (
                nextPage &&
                (this.plugin.pluginOptions.playlistLoadlimit === 0
                    ? true
                    : pageLoaded < this.plugin.pluginOptions.playlistLoadlimit!)
            ) {
                const spotifyEpisodePage: SpotifyShow["episodes"] = await petitio(nextPage)
                    .header("Authorization", this.plugin.spotifyToken)
                    .json();
                spotifyShow.episodes.items.push(...spotifyEpisodePage.items);
                nextPage = spotifyEpisodePage.next;
                pageLoaded++;
            }
            const unresolvedSpotifyTracks = spotifyShow.episodes.items.map(x => this.plugin.buildUnresolved(x));
            if (trackId) this.cache.set(trackId, { tracks: unresolvedSpotifyTracks, playlistName: spotifyShow.name });
            return this.plugin.buildResponse("PLAYLIST_LOADED", unresolvedSpotifyTracks, { name: spotifyShow.name, selectedTrack: -1 });
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
