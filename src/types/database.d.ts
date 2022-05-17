import { Track } from "@zuikaku/Handlers/ShoukakuExtension";
import { Document, Types } from "mongoose";

export type documentType<T> = Document<unknown, any, T> &
    T & { _id: Types.ObjectId };

export interface IGuildSchema {
    guildId: string;
    guildPlayer: {
        channelId: string;
        messageId: string;
    };
    persistentQueue: {
        textId: string;
        voiceId: string;
        playerMessageId?: string;
        current?: Track;
        tracks: Track[] | [];
        previous?: Track;
        queueRepeat: boolean;
        trackRepeat: boolean;
        volume: number;
        position: number;
    };
}

export interface IUserSchema {
    userId: string;
    playlists: {
        id: string;
        name: string;
        duration: string;
        tracks: {
            id: string;
            author: string;
            title: string;
            url: string;
            length: number;
            artwork?: string;
            source: string;
            ISRC?: string;
        }[];
    }[];
}
