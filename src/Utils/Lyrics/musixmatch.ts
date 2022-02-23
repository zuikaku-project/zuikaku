/* eslint-disable @typescript-eslint/naming-convention */
import { IMusixmatch } from "@zuikaku/types";
import { load } from "cheerio";
import petitio from "petitio";

export class Musixmatch {
    public header = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
        captcha_id: "Pm%2FqH%2Fiuzw2fX5J8oFuzaq6yPlZdZ2rZ2v0EIgwd%2BCvrJZqDv11xoa2wy69%2FxWGMjMWSL372yzUk009tIV1f2BOMETReZTtX05tDJ49I9OStNogRQeCpT5hG8DddoXhm"
    };

    public async search(name: string): Promise<string | undefined> {
        const data = await petitio(`https://www.musixmatch.com/search/${encodeURI(name)}/tracks`, "GET").header(this.header).text();
        const $ = load(data);
        const result = $(".media-card-title a").first().attr("href");
        return result;
    }

    public async lyrics(url: string): Promise<IMusixmatch | undefined> {
        const data = await petitio(`https://www.musixmatch.com${url}`, "GET").header(this.header).text();
        const $ = load(data);
        const result: IMusixmatch = {
            title: "",
            artists: "",
            lyrics: "",
            albumImg: "",
            url: ""
        };
        $(".mxm-track-title__track small").remove();
        result.title = $(".mxm-track-title__track").text();
        result.artists = $(".mxm-track-title h2").text();
        result.lyrics = $(".mxm-lyrics__content").text();
        result.albumImg = `http:${$(".banner-album-image-desktop img").attr("src")!}`;
        result.url = `https://www.musixmatch.com${url}`;
        return result.lyrics || !result.lyrics.length ? result : undefined;
    }

    public async find(title: string): Promise<IMusixmatch | undefined> {
        const searchResult = await this.search(title);
        if (!searchResult) return undefined;
        const songResult = await this.lyrics(searchResult);
        if (!songResult) return undefined;
        return songResult;
    }
}
