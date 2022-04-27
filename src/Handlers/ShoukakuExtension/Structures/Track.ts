import { DataInput, Utils } from "@zuikaku/Utils";
import { User } from "discord.js";
import { ShoukakuTrack } from "shoukaku";
import { ShoukakuHandler } from "../ShoukakuHandler";

export class Track {
    public isrc?: string;
    public track = this.raw.track;
    public info!: TrackInfo;
    public _requester!: User;
    public resolve!: () => Promise<void>;
    private readonly _shoukaku!: ShoukakuHandler;
    public constructor(public readonly raw: ShoukakuTrack) {
        this.decode();
    }

    public get thumbnail(): string | undefined {
        if (this.info.artworkUrl) return this.info.artworkUrl;
        return `https://i.ytimg.com/vi/${this.info
            .identifier!}/maxresdefault.jpg`;
    }

    public get durationFormated(): string | undefined {
        return Utils.parseMs(this.raw.info.length!, {
            colonNotation: true
        }).colonNotation;
    }

    public get shoukaku(): ShoukakuHandler | undefined {
        return this._shoukaku;
    }

    public setShoukaku(shoukakuHandler: ShoukakuHandler): void {
        Object.defineProperty(this, "_shoukaku", { value: shoukakuHandler });
    }

    public get requester(): User | undefined {
        return this._requester;
    }

    public setRequester(user: User): void {
        this._requester = user;
    }

    public decode(): void {
        if (!this.track) {
            this.isrc = this.raw.isrc!;
            this.info = this.raw.info;
            this.resolve = () => Track.resolve(this.shoukaku!, this);
            return;
        }
        try {
            const input = new DataInput(this.track);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            input.readInt() >> 30;
            input.readByte();

            this.info = {
                title: input.readUTF(),
                author: input.readUTF(),
                length: Number(input.readLong()),
                identifier: input.readUTF(),
                isStream: input.readBoolean(),
                uri: input.readBoolean() ? input.readUTF() : undefined,
                artworkUrl: input.readBoolean() ? input.readUTF() : undefined,
                sourceName: input.readUTF(),
                position: Number(input.readLong()),
                isSeekable: this.raw.info.isSeekable
            };
        } catch {
            this.info = this.raw.info;
        }
    }

    public static async getClosestTrack(
        shoukaku: ShoukakuHandler,
        track: Track
    ): Promise<Track | undefined> {
        const isFromPlugin =
            shoukaku.plugin.appleRegex.test(track.info.uri ?? "") ||
            shoukaku.plugin.deezerRegex.test(track.info.uri ?? "") ||
            shoukaku.plugin.spotifyRegex.test(track.info.uri ?? "");
        let response = await shoukaku.getTracks(
            track.isrc?.length
                ? track.isrc
                : (isFromPlugin
                      ? `${track.info.author ?? ""} ${track.info.title ?? ""}`
                      : track.info.uri) ?? ""
        );
        if (
            ["LOAD_FAILED", "NO_MATCHES"].includes(response.type) ||
            !response.tracks.length
        ) {
            response = await shoukaku.getTracks(
                isFromPlugin
                    ? `${track.info.author ?? ""} ${track.info.title ?? ""}`
                    : track.info.uri ?? ""
            );
        }
        const firstTrack = response.tracks[0];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (firstTrack) {
            Object.assign(firstTrack.info, {
                identifier: track.info.identifier ?? firstTrack.info.identifier,
                author: track.info.author ?? firstTrack.info.author,
                title: track.info.title ?? firstTrack.info.title,
                uri: track.info.uri ?? firstTrack.info.uri,
                length: track.info.length ?? firstTrack.info.length,
                artworkUrl: track.info.artworkUrl ?? firstTrack.info.artworkUrl,
                sourceName: track.info.sourceName ?? firstTrack.info.sourceName
            });
        }
        return Utils.structuredClone(firstTrack);
    }

    public static async resolve(
        shoukaku: ShoukakuHandler,
        track: Track
    ): Promise<void> {
        const validated = track;
        const resolved = await Track.getClosestTrack(shoukaku, track);
        Object.getOwnPropertyNames(track)
            .filter(key => ["track", "info", "resolve", "isrc"].includes(key))
            // @ts-expect-error dynamical delete
            .forEach(key => delete track[key]); // eslint-disable-line
        Object.assign(validated, resolved);
    }
}

interface TrackInfo {
    title?: string;
    author?: string;
    length?: number;
    identifier?: string;
    isStream?: boolean;
    uri?: string;
    artworkUrl?: string;
    sourceName?: string;
    position?: number;
    isSeekable?: boolean;
}
