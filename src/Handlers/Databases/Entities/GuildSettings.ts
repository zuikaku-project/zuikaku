import { Track } from "@zuikaku/Handlers";
import { Entity, Column, ObjectID, ObjectIdColumn, PrimaryColumn } from "typeorm";

@Entity({ name: "guilds" })
export class GuildSettings {
    @ObjectIdColumn()
    public _id!: ObjectID;

    @PrimaryColumn()
    public guildId!: string;

    @Column()
    public guildPlayer: {
        channelId: string;
        messageId: string;
    } | undefined;

    @Column()
    public persistenceQueue!: {
        textId: string;
        voiceId: string;
        current?: Track;
        tracks: Track[] | [];
        previous?: Track;
        queueRepeat: boolean;
        trackRepeat: boolean;
        volume: number;
        position: number;
    } | undefined;
}
