import { IUserSchema } from "#zuikaku/types";
import mongoose from "mongoose";

const { Schema } = mongoose;

export const UserSchema = new Schema<IUserSchema>({
    userId: String,
    playlists: [
        {
            id: String,
            name: String,
            duration: String,
            tracks: [
                {
                    id: String,
                    author: String,
                    title: String,
                    url: String,
                    length: Number,
                    artwork: String,
                    source: String,
                    ISRC: String
                }
            ]
        }
    ]
});
