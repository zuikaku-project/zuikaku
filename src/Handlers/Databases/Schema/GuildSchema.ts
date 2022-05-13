import { IGuildSchema } from "@zuikaku/types";
import { Schema } from "mongoose";

export const GuildSchema = new Schema<IGuildSchema>({
    guildId: String,
    guildPlayer: {
        channelId: { type: String, default: null },
        messageId: { type: String, default: null }
    },
    persistentQueue: {
        textId: { type: String, default: null },
        voiceId: { type: String, default: null },
        playerMessageId: { type: String, default: null },
        current: { type: Schema.Types.Mixed, default: null },
        tracks: {
            type: [Schema.Types.Mixed],
            default: []
        },
        previous: { type: Schema.Types.Mixed, default: null },
        queueRepeat: { type: Boolean, default: false },
        trackRepeat: { type: Boolean, default: false },
        volume: { type: Number, default: 0 },
        position: { type: Number, default: 0 }
    }
});
