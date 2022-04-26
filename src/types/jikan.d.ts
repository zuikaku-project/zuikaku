export interface JikanAnimeInterface {
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
    };
    data: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
            webp: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
        };
        trailer: {
            youtube_id: string;
            url: string;
            embed_url: string;
            images: {
                image_url: string;
                small_image_url: string;
                medium_image_url: string;
                large_image_url: string;
                maximum_image_url: string;
            };
        };
        title: string;
        title_english: string;
        title_japanese: string;
        title_synonyms: string[];
        type: string;
        source: string;
        episodes: number;
        status: string;
        airing: boolean;
        aired: {
            from: string | null;
            to: string | null;
            prop: {
                from: {
                    day: number | null;
                    month: number | null;
                    year: number | null;
                };
                to: {
                    day: number | null;
                    month: number | null;
                    year: number | null;
                };
            };
            string: string | null;
        };
        duration: string;
        rating: string;
        score: number;
        scored_by: number;
        rank: number;
        popularity: number;
        members: number;
        favorites: number;
        synopsis: string;
        background: string;
        season: string;
        year: number;
        broadcast: {
            day: string;
            time: string;
            timezone: string;
            string: string;
        };
        related: Related;
        producers: JikanSubProperty[];
        licensors: JikanSubProperty[];
        studios: JikanSubProperty[];
        genres: JikanSubProperty[];
        themes: JikanSubProperty[];
        demographics: JikanSubProperty[];
    }[];
}

export interface JikanMangaInterface {
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
    };
    data: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
            webp: {
                image_url: string;
                small_image_url: string;
                large_image_url: string;
            };
        };
        title: string;
        title_english: string | null;
        title_japanese: string | null;
        title_synonyms: string[];
        type: string;
        chapters: number | null;
        volumes: number | null;
        status: string;
        publishing: boolean;
        published: {
            from: string | null;
            to: string | null;
            prop: {
                from: {
                    day: number;
                    month: number;
                    year: number;
                };
                to: {
                    day: number;
                    month: number;
                    year: number;
                };
            };
            string: string;
        };
        scored: number;
        scored_by: number;
        rank: number;
        popularity: number;
        members: number;
        favorites: number;
        synopsis: string;
        background: string;
        authors: JikanSubProperty[];
        serializations: JikanSubProperty[];
        genres: JikanSubProperty[];
        themes: JikanSubProperty[];
        demographics: JikanSubProperty[];
    }[];
}

export interface JikanCharactersInterface {
    pagination: {
        last_visible_page: number;
        has_next_page: boolean;
    };
    data: {
        mal_id: number;
        url: string;
        images: {
            jpg: {
                image_url: string;
            };
            webp: {
                image_url: string;
                small_image_url: string;
            };
        };
        name: string;
        nicknames: string[];
        favorites: number;
        about: string;
    }[];
}

export interface Related {
    Adaptation: string[];
    Prequel: string[];
    Sequel: string[];
    Side_story: string[];
    Character: string[];
    Spin_off: string[];
    Summary: string[];
    Alternative_setting: string[];
    Other: string[];
}

export interface JikanSubProperty {
    mal_id: number;
    type: string;
    name: string;
    url: string;
}
