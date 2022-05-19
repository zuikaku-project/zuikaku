import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { TrackList } from "#zuikaku/Handlers/ShoukakuExtension/Structures";
import { ZuikakuPlugin } from "#zuikaku/Structures/ZuikakuPlugin";
import { DeezerTrack, IPluginComponent, LavalinkTrack } from "#zuikaku/types";
import petitio from "petitio";

@ZuikakuDecorator<IPluginComponent>({
    name: "track",
    category: "deezer"
})
export default class deezerTrackResolver extends ZuikakuPlugin {
    public cache: Map<string, LavalinkTrack> = new Map();
    public async fetch(trackId: string): Promise<TrackList | undefined> {
        try {
            if (this.cache.has(trackId)) {
                return this.plugin.buildResponse("TRACK_LOADED", [
                    this.cache.get(trackId)!
                ]);
            }
            const deezerTrack: DeezerTrack = await petitio(
                `${this.plugin.deezerBaseURL}/track/${trackId}`
            ).json();
            const isrc = deezerTrack.isrc ?? "";
            const identifier = deezerTrack.id ?? "";
            const author = deezerTrack.artist?.name ?? "";
            const title = deezerTrack.title ?? "";
            const uri = deezerTrack.link ?? "";
            const length = deezerTrack.duration! * 1000;
            const artworkUrl = deezerTrack.md5_image
                ? `https://e-cdns-images.dzcdn.net/images/cover/${deezerTrack.md5_image}/1000x1000-000000-80-0-0.jpg`
                : "";
            const sourceName = "deezer";
            const unresolvedTrack = this.plugin.buildUnresolved({
                isrc,
                identifier,
                author,
                title,
                uri,
                length,
                artworkUrl,
                sourceName
            });
            if (trackId) this.cache.set(trackId, unresolvedTrack);
            return this.plugin.buildResponse("TRACK_LOADED", [unresolvedTrack]);
        } catch {
            return this.plugin.buildResponse("LOAD_FAILED", []);
        }
    }
}
