import { ShoukakuTrack } from "shoukaku";
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
        current?: ShoukakuTrack;
        tracks: ShoukakuTrack[] | [];
        previous?: ShoukakuTrack;
        queueRepeat: boolean;
        trackRepeat: boolean;
        volume: number;
        position: number;
    } | undefined;
}
