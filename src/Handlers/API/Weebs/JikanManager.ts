/* eslint-disable @typescript-eslint/naming-convention */
import { JikanAnimeInterface, JikanMangaInterface, JikanCharactersInterface } from "@zuikaku/types";
import petitio from "petitio";

export class JikanManager {
    public async getAnime(querySearch: string): Promise<JikanAnimeInterface> {
        return this.fetchJikan<JikanAnimeInterface>(querySearch, "anime");
    }

    public async getManga(querySearch: string): Promise<JikanMangaInterface> {
        return this.fetchJikan<JikanMangaInterface>(querySearch, "manga");
    }

    public async getCharacters(querySearch: string): Promise<JikanCharactersInterface> {
        return this.fetchJikan<JikanCharactersInterface>(querySearch, "characters");
    }

    private async fetchJikan<JikanAnimeInterface>(querySearch: string, type: "anime"): Promise<JikanAnimeInterface>;
    private async fetchJikan<JikanMangaInterface>(querySearch: string, type: "manga"): Promise<JikanMangaInterface>;
    private async fetchJikan<JikanCharactersInterface>(querySearch: string, type: "characters"): Promise<JikanCharactersInterface>;
    private async fetchJikan<T>(querySearch: string, type: "anime" | "characters" | "manga"): Promise<T> {
        const requestJikan = await petitio("https://api.jikan.moe/v4", "GET")
            .path(type)
            .query("q", querySearch)
            .json();
        return requestJikan as T;
    }
}
