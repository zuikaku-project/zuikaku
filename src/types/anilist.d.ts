/* eslint-disable @typescript-eslint/naming-convention */
export interface AnilistAnimeMangaInterface {
    data: {
        Page: {
            pageInfo: {
                total: number;
                perPage: number;
                currentPage: number;
                lastPage: number;
                hasNextPage: boolean;
            };
            media: {
                id: number;
                siteUrl: string;
                title: {
                    romaji: string;
                    english: string;
                    native: string;
                    userPreferred: string;
                };
                type: string;
                format: string;
                status: string;
                description: string;
                startDate: {
                    year: number;
                    month: number;
                    day: number;
                };
                endDate: {
                    year: number;
                    month: number;
                    day: number;
                };
                chapters: number;
                volumes: number;
                episodes: number;
                duration: number;
                countryOfOrigin: string;
                source: string;
                coverImage: {
                    extraLarge: string;
                    large: string;
                    medium: string;
                    color: string;
                };
                bannerImage: string;
                genres: string[];
                synonyms: string[];
                averageScore: number;
                meanScore: number;
            }[];
        };
    };
}

export interface AnilistUsersInterface {
    data: {
        Page: {
            pageInfo: {
                total: number;
                perPage: number;
                currentPage: number;
                lastPage: number;
                hasNextPage: boolean;
            };
            users: {
                name: string;
                id: number;
                siteUrl: string;
                avatar: {
                    medium: string;
                    large: string;
                };
                createdAt: number;
                updateAt: number;
                bannerImage: string;
                statistics: {
                    anime: {
                        count: number;
                        meanScore: number;
                        standardDeviation: number;
                        minutesWatched: number;
                        episodesWatched: number;
                        chaptersRead: number;
                        volumesRead: number;
                    };
                    manga: {
                        count: number;
                        meanScore: number;
                        standardDeviation: number;
                        minutesWatched: number;
                        episodesWatched: number;
                        chaptersRead: number;
                        volumesRead: number;
                    };
                };
            }[];
        };
    };
}

export interface AnilistCharactersInterface {
    data: {
        Page: {
            pageInfo: {
                total: number;
                perPage: number;
                currentPage: number;
                lastPage: number;
                hasNextPage: boolean;
            };
            characters: {
                id: number;
                siteUrl: string;
                name: {
                    first: string;
                    middle: string;
                    last: string;
                    full: string;
                    native: string;
                    userPreferred: string;
                };
                image: {
                    large: string;
                    medium: string;
                };
                description: string;
                gender: string;
                dateOfBirth: {
                    year: number;
                    month: number;
                    day: number;
                };
                age: number;
                bloodType: string;
            }[];
        };
    };
}
