import { ISpotifyLyrics } from "#zuikaku/types";
import petitio from "petitio";
import { Node, NodeOption, Rest } from "shoukaku";
import { Lyrics } from "../Lyrics";

export class ShoukakuRest extends Rest {
    private readonly nodeUrl!: string;
    private readonly nodeAuth!: string;
    public constructor(node: Node, options: NodeOption) {
        super(node, options);
        Object.defineProperties(this, {
            nodeUrl: {
                value: `${options.secure ? "https" : "http"}://${options.url}`
            },
            nodeAuth: { value: options.auth }
        });
    }

    public async getLyrics(query: string): Promise<Lyrics> {
        const url = new URL(`${this.nodeUrl}/lyrics`);
        url.searchParams.set("title", query);

        try {
            const response = await petitio(url.toString())
                .header("Authorization", this.nodeAuth)
                .json<ISpotifyLyrics>();
            return new Lyrics(response);
        } catch {
            return new Lyrics();
        }
    }
}
