import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { IPluginComponent, Track, SpotifyShow } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "show",
    category: "spotify"
})
export default class spotifyShowResolver extends ZuikakuPlugin {
    public cache: Map<string, { tracks: Track[]; playlistName: string }> =
        new Map();

    public async fetch(trackId: string): Promise<TrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse(
                    "PLAYLIST_LOADED",
                    this.cache.get(trackId)!.tracks,
                    {
                        name: this.cache.get(trackId)!.playlistName,
                        selectedTrack: -1
                    }
                );
            }
            const spotifyShow: SpotifyShow = await petitio(
                `${this.plugin.baseUrl.spotify}/shows/${trackId}`
            )
                .query("market", "US")
                .header("Authorization", this.plugin.token.spotify)
                .json();
            let nextPage = spotifyShow.episodes.next;
            let pageLoaded = 1;
            while (
                nextPage &&
                (this.plugin.pluginOptions.playlistLoadlimit === 0
                    ? true
                    : pageLoaded < this.plugin.pluginOptions.playlistLoadlimit!)
            ) {
                const spotifyEpisodePage: SpotifyShow["episodes"] =
                    await petitio(nextPage)
                        .header("Authorization", this.plugin.token.spotify)
                        .json();
                spotifyShow.episodes.items.push(...spotifyEpisodePage.items);
                nextPage = spotifyEpisodePage.next;
                pageLoaded++;
            }
            const unresolvedSpotifyTracks = spotifyShow.episodes.items.map(
                spotifyEpisode => {
                    const isrc = "";
                    const identifier = spotifyEpisode.id;
                    const author = spotifyShow.publisher;
                    const title = spotifyEpisode.name;
                    const uri = spotifyEpisode.external_urls.spotify;
                    const length = spotifyEpisode.duration_ms;
                    const artworkUrl = spotifyEpisode.images[0].url;
                    const sourceName = "spotify";
                    return this.plugin.buildUnresolved({
                        isrc,
                        identifier,
                        author,
                        title,
                        uri,
                        length,
                        artworkUrl,
                        sourceName
                    });
                }
            );
            if (trackId)
                this.cache.set(trackId, {
                    tracks: unresolvedSpotifyTracks,
                    playlistName: spotifyShow.name
                });
            return this.plugin.buildResponse(
                "PLAYLIST_LOADED",
                unresolvedSpotifyTracks,
                { name: spotifyShow.name, selectedTrack: -1 }
            );
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
