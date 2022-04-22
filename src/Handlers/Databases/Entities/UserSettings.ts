import { Column, Entity, ObjectID, ObjectIdColumn, PrimaryColumn } from "typeorm";

@Entity({ name: "user" })
export class UserSettings {
    @ObjectIdColumn()
    public _id!: ObjectID;

    @PrimaryColumn()
    public userId!: string;

    @Column()
    public playlists!: {
        playlistId: string;
        playlistName: string;
        playlistDuration: string;
        playlistTracks: {
            trackId: string;
            trackAuthor: string;
            trackTitle: string;
            trackURL: string;
            trackLength: number;
            trackArtwork?: string;
            trackSource: string;
            trackIsrc?: string;
        }[];
    }[];
}
