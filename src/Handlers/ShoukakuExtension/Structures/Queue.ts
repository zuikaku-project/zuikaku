import { Utils } from "#zuikaku/Utils";
import { MessageButton } from "discord.js";
import { Dispatcher } from "./Dispatcher";
import { Track } from "./Track";

export class Queue {
    public current: Track | null = null;
    public previous: Track | null = null;
    public tracks: Track[] = [];

    public constructor(public readonly dispatcher: Dispatcher) {}

    public get getTrackSize(): number {
        return this.tracks.length + (this.current ? 1 : 0);
    }

    public clearTrack(): void {
        this.tracks = [];
    }

    public async addTrack(track: Track | Track[]): Promise<void> {
        if (!this.current) {
            if (!Array.isArray(track)) {
                this.current = track;
                return;
            }
            this.current = (track = [...track]).shift()!;
        }
        if (track instanceof Array) {
            this.tracks.push(...track);
        } else {
            this.tracks.push(track);
        }
        if (this.dispatcher.queueMessage.lastPlayerMessage) {
            const row =
                this.dispatcher.queueMessage.lastPlayerMessage.components[0];
            const findNextTrackButton = row.components.find(
                x =>
                    Utils.encodeDecodeBase64String(
                        x.customId ?? "",
                        true
                    ).split("_")[1] === "NEXT-TRACK"
            ) as MessageButton | undefined;
            if (findNextTrackButton) {
                findNextTrackButton.setDisabled(false).setStyle("PRIMARY");
                row.components.splice(3, 1, findNextTrackButton);
            }
            await this.dispatcher.queueMessage.lastPlayerMessage
                .edit({ components: [row] })
                .catch(() => null);
        }
    }

    public async removeTrack(track: number, range: number): Promise<Track[]> {
        const spliced = this.tracks.splice(track, range ? range : 1);
        const getGuildDatabase = await this.dispatcher.getGuildDatabase;
        if (getGuildDatabase?.guildPlayer.channelId)
            setTimeout(() => this.dispatcher.getEmbedPlayer?.update(), 500);
        if (
            this.dispatcher.queueMessage.lastPlayerMessage &&
            !this.tracks.length
        ) {
            const row =
                this.dispatcher.queueMessage.lastPlayerMessage.components[0];
            const findNextTrackButton = row.components.find(
                x =>
                    Utils.encodeDecodeBase64String(
                        x.customId ?? "",
                        true
                    ).split("_")[1] === "NEXT-TRACK"
            ) as MessageButton | undefined;
            if (findNextTrackButton) {
                findNextTrackButton.setDisabled(true).setStyle("SECONDARY");
                row.components.splice(3, 1, findNextTrackButton);
            }
            await this.dispatcher.queueMessage.lastPlayerMessage
                .edit({ components: [row] })
                .catch(() => null);
        }
        return spliced;
    }

    public shuffleTrack(): void {
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }
        void this.dispatcher.getGuildDatabase.then(guildSettings => {
            if (guildSettings?.guildPlayer.channelId)
                setTimeout(() => this.dispatcher.getEmbedPlayer?.update(), 500);
        });
    }
}
