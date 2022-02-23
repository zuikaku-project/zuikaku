import { AnilistAnimeMangaInterface, AnilistUsersInterface, AnilistCharactersInterface } from "@zuikaku/types";
import petitio from "petitio";

export class AnilistManager {
    public async getAnime(querySearch: string): Promise<AnilistAnimeMangaInterface> {
        const query = `
        query ($page: Int, $perPage: Int, $search: String, $type: MediaType) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    perPage
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(search: $search, type: $type, sort: TITLE_ROMAJI) {
                    id
                    siteUrl
                    title {
                        romaji
                        english
                        native
                        userPreferred
                    }
                    type
                    format
                    status
                    description
                    startDate {
                        year
                        month
                        day
                    }
                    endDate {
                        year
                        month
                        day
                    }
                    episodes
                    duration
                    countryOfOrigin
                    source
                    coverImage {
                        extraLarge
                        large
                        medium
                        color
                    }
                    bannerImage
                    genres
                    synonyms
                    averageScore
                    meanScore
                }
            }
        }`;
        return this.fetchAnilist<AnilistAnimeMangaInterface>(querySearch, query, "ANIME");
    }

    public async getManga(querySearch: string): Promise<AnilistAnimeMangaInterface> {
        const query = `
        query ($page: Int, $perPage: Int, $search: String, $type: MediaType) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    perPage
                    currentPage
                    lastPage
                    hasNextPage
                }
                media(search: $search, type: $type, sort: TITLE_ROMAJI) {
                    id
                    siteUrl
                    title {
                        romaji
                        english
                        native
                        userPreferred
                    }
                    type
                    format
                    status
                    description
                    startDate {
                        year
                        month
                        day
                    }
                    endDate {
                        year
                        month
                        day
                    }
                    chapters
                    volumes
                    countryOfOrigin
                    source
                    coverImage {
                        extraLarge
                        large
                        medium
                        color
                    }
                    bannerImage
                    genres
                    synonyms
                    averageScore
                    meanScore
                }
            }
        }`;
        return this.fetchAnilist<AnilistAnimeMangaInterface>(querySearch, query, "MANGA");
    }

    public async getUser(querySearch: string): Promise<AnilistUsersInterface> {
        const query = `
        query ($page: Int, $perPage: Int, $search: String) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    perPage
                    currentPage
                    lastPage
                    hasNextPage
                }
                User(search: $search) {
                    id
                    siteUrl
                    name
                    about
                    avatar {
                        large
                        medium
                    }
                    bannerImage
                    createdAt
                    updatedAt
                    statistics{
                        anime{
                            count
                            meanScore
                            standardDeviation
                            minutesWatched
                            episodesWatched
                            chaptersRead
                            volumesRead
                        }
                        manga{
                            count
                            meanScore
                            standardDeviation
                            minutesWatched
                            episodesWatched
                            chaptersRead
                            volumesRead
                        }
                    }
                }
            }
        }`;
        return this.fetchAnilist<AnilistUsersInterface>(querySearch, query, "USERS");
    }

    public async getCharacters(querySearch: string): Promise<AnilistCharactersInterface> {
        const query = `
        query ($page: Int, $perPage: Int, $search: String) {
            Page(page: $page, perPage: $perPage) {
                pageInfo {
                    total
                    perPage
                    currentPage
                    lastPage
                    hasNextPage
                }
                characters(search: $search) {
                    id
                    siteUrl
                    name {
                        first
                        middle
                        last
                        full
                        native
                        userPreferred
                    }
                    image {
                        large
                        medium
                    }
                    description
                    gender
                    dateOfBirth {
                        year
                        month
                        day
                    }
                    age
                    bloodType
                }
            }
        }`;
        return this.fetchAnilist<AnilistCharactersInterface>(querySearch, query, "CHARACTERS");
    }

    private async fetchAnilist<AnilistAnimeMangaInterface>(querySearch: string, query: string, type: "ANIME" | "MANGA"): Promise<AnilistAnimeMangaInterface>;
    private async fetchAnilist<AnilistUsersInterface>(querySearch: string, query: string, type: "USERS"): Promise<AnilistUsersInterface>;
    private async fetchAnilist<AnilistCharactersInterface>(querySearch: string, query: string, type: "CHARACTERS"): Promise<AnilistCharactersInterface>;
    private async fetchAnilist<T>(querySearch: string, query: string, type: "ANIME" | "CHARACTERS" | "MANGA" | "USERS"): Promise<T> {
        const variables = {
            search: querySearch,
            page: 1,
            perPage: 10,
            type
        };
        const headers = {
            "Content-Type": "application/json",
            Accept: "application/json"
        };
        const requestGraphql = await petitio("https://graphql.anilist.co", "POST")
            .body(JSON.stringify({ query, variables }))
            .header(headers)
            .json() as T;
        return requestGraphql;
    }
}
