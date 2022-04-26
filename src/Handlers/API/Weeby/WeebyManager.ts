import { RequestHandler } from "./RequestHandler";

export class WeebyManager {
    private readonly _token: string;

    public constructor() {
        this._token =
            "MjQzNzI4NTczNjI0NjE0OTEy.6GgFtV7pb9l28ybcDDUv1yz4noWpEefZnYGPpf7Jr4k";
    }

    public gif(type: GIF): Promise<any> {
        return this._request({ path: `/gif/${type}` });
    }

    public word(type: Words | WordsII): Promise<any> {
        let request: any;
        if (["random", "halloween", "christmas", "list"].includes(type)) {
            request = this._request({ path: `/json/word/${type}` });
        } else {
            request = this._request({ path: `/json/${type}` });
        }
        return request;
    }

    private _request(options: RequestOptions): Promise<any> {
        let qs = "";
        if (options.params) {
            qs = this._queryString(options.params);
        }
        return new Promise(resolve => {
            RequestHandler({
                token: this._token,
                path: `${options.path}${options.params ? `?${qs}` : ""}`
            })
                .then(a => resolve(a))
                .catch(e => console.log(e));
        });
    }

    private _queryString(options: QueryParams): string {
        let QueryString = "";
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        for (const keyName of Object.keys(options.params)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const oldValue = options.params[keyName];
            const newValue = Array.isArray(oldValue)
                ? oldValue.map(String).join(", ")
                : String(oldValue);
            QueryString += `${keyName}=${newValue}&`;
        }
        return QueryString;
    }
}

export type GIF =
    | "akko"
    | "beer"
    | "bite"
    | "blush"
    | "bonk"
    | "cheer"
    | "clap"
    | "confused"
    | "cookie"
    | "cringe"
    | "cry"
    | "cuddle"
    | "dance"
    | "feed"
    | "flower"
    | "gabriel"
    | "grin"
    | "handhold"
    | "hug"
    | "kiss"
    | "lick"
    | "lurk"
    | "miyano"
    | "nervous"
    | "nom"
    | "nuzzle"
    | "pat"
    | "pat"
    | "pikachu"
    | "poke"
    | "pout"
    | "sagiri"
    | "slap"
    | "sleepy"
    | "throw"
    | "triggered"
    | "wave"
    | "zerotwo";

export type Words = "christmas" | "halloween" | "list" | "random";

export type WordsII =
    | "8ball"
    | "belikebill"
    | "dadjoke"
    | "geography"
    | "joke"
    | "roast";

export type QueryParams = Record<string, any>;

export interface RequestOptions {
    path: string;
    params?: QueryParams;
}
