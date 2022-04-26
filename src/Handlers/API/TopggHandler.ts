/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/naming-convention*/
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { Snowflake } from "discord.js";
import petitio from "petitio";

export class TopggHandler {
    public baseURL!: string;
    public token!: string;
    public constructor(public client: ZuikakuClient) {
        Object.defineProperty(this, "baseURL", {
            value: "https://top.gg/api",
            enumerable: true
        });
        Object.defineProperty(this, "token", {
            value: this.client.config.dblapi,
            enumerable: true
        });
    }

    public async postStats(stats: {
        serverCount: number;
        shardId?: number;
        shardCount?: number;
    }): Promise<{
        serverCount: number;
        shardId?: number;
        shardCount?: number;
    }> {
        await this._request({
            method: "POST",
            path: `/bots/${this.client.user!.id}/stats`,
            body: {
                server_count: stats.serverCount,
                shard_id: stats.shardId,
                shard_count: stats.shardCount
            }
        });
        return stats;
    }

    public async getStats(id?: Snowflake): Promise<DBLGetStats | undefined> {
        if (!id) throw new Error("ID missing");
        return this._request<DBLGetStats>({
            method: "GET",
            path: `/bots/${id}/stats`
        });
    }

    public async getBot(id?: Snowflake): Promise<DBLGetBot | undefined> {
        if (!id) throw new Error("ID missing");
        return this._request<DBLGetBot>({
            method: "GET",
            path: `/bots/${id}`
        });
    }

    public async getUser(id?: Snowflake): Promise<DBLGetUsers | undefined> {
        if (!id) throw new Error("ID Missing");
        return this._request<DBLGetUsers>({
            method: "GET",
            path: `/users/${id}`
        });
    }

    public async getVotes(id: Snowflake): Promise<DBLGetVotes[] | undefined> {
        if (!this.token) throw new Error("Missing token");
        return this._request<DBLGetVotes[]>({
            method: "GET",
            path: `/bots/${id}/votes`
        });
    }

    public async hasVoted(value: {
        botId?: Snowflake;
        userId?: Snowflake;
    }): Promise<boolean> {
        if (!value.botId || !value.userId) throw new Error("Missing ID");
        return this._request<DBLHasVoted>({
            method: "GET",
            path: `/bots/${value.botId}/check`,
            body: {
                userId: value.userId
            }
        }).then(x => Boolean(x?.voted));
    }

    private async _request<T>(options: RequestOptions): Promise<T | undefined> {
        const createPetitio = petitio(this.baseURL, options.method).header(
            "Authorization",
            this.token
        );
        if (options.body && options.method === "GET") {
            createPetitio.query(options.body);
        }
        if (options.method !== "GET") {
            createPetitio.header("Content-Type", "application/json");
        }
        const response = await createPetitio.send();
        if (response.statusCode !== 200) {
            return undefined;
        }
        if (response.headers["content-type"].startsWith("application/json")) {
            return response.json();
        }
    }
}

interface RequestOptions {
    method:
        | "CONNECT"
        | "DELETE"
        | "GET"
        | "HEAD"
        | "OPTIONS"
        | "PATCH"
        | "POST"
        | "PUT"
        | "TRACE";
    path: string;
    body?: {
        server_count?: number[] | number;
        shard_id?: number;
        shard_count?: number;
        shards?: number[];
        userId?: string;
    };
}

interface DBLGetStats {
    server_count: number;
    shards: string[];
    shard_count: number;
}

interface DBLGetBot {
    defAvatar: string | null;
    invite: string | null;
    website: string | null;
    support: string | null;
    github: string | null;
    longdesc: string;
    shortdesc: string;
    prefix: string;
    clientid: string;
    avatar: string | null;
    id: string;
    discriminator: string;
    username: string;
    date: string;
    server_count: number | null;
    shard_count: number | null;
    guilds: number[];
    shards: number[];
    monthlyPoints: number;
    points: number;
    certifiedBot: boolean;
    owners: string[];
    tags: string[];
    bannerUrl: string | null;
    donatebotguildid: string | null;
}

interface DBLGetUsers {
    discriminator: string;
    avatar: string;
    id: string;
    username: string;
    defAvatar: string;
    admin: boolean;
    webMod: boolean;
    mod: boolean;
    certifiedDev: boolean;
    supporter: boolean;
}

interface DBLGetVotes {
    username: string;
    id: string;
    avatar: string;
}

interface DBLHasVoted {
    voted: number;
}
