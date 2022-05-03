import {
    AnilistManager,
    CanvasHandler,
    CommandHandler,
    GuildDatabaseManager,
    JikanManager,
    ListenerHandler,
    RouterHandler,
    ShoukakuHandler,
    TopggHandler,
    UserDatabaseManager,
    WeebyManager
} from "@zuikaku/Handlers";
import { IConfig, ISnipe } from "@zuikaku/types";
import { Logger, Utils } from "@zuikaku/Utils";
import { Client, Intents, Options, Sweepers } from "discord.js";
import { resolve } from "node:path";
import process from "node:process";
import { DataSource } from "typeorm";

export class ZuikakuClient extends Client {
    public readonly snipe = new Map<string, ISnipe[]>();
    public readonly logger = new Logger();
    public readonly utils = new Utils();
    public readonly apis = {
        canvas: new CanvasHandler(this),
        dbl: new TopggHandler(this),
        weebs: {
            anilist: new AnilistManager(),
            jikan: new JikanManager(),
            weeby: new WeebyManager()
        }
    };

    public readonly shoukaku = new ShoukakuHandler(this);
    public readonly database = {
        dataSource: new DataSource({
            database: "database",
            type: "mongodb",
            url: `mongodb+srv://12345:qwerty111@database.ewzkt.mongodb.net/${
                this.config.devMode ? "development" : "database"
            }`,
            useUnifiedTopology: true,
            ssl: true,
            sslValidate: true,
            useNewUrlParser: true,
            entities: [
                `${resolve(
                    __dirname,
                    "../Handlers/Databases/Entities"
                )}/**/*.js`
            ]
        }),
        entity: {
            guilds: new GuildDatabaseManager(),
            users: new UserDatabaseManager()
        }
    };

    public readonly listener = new ListenerHandler(
        this,
        resolve(__dirname, "../Listeners")
    );

    public readonly command = new CommandHandler(
        this,
        resolve(__dirname, "../Commands")
    );

    public readonly router = new RouterHandler(
        this,
        resolve(__dirname, "../Routers")
    );

    public constructor(public readonly config: IConfig) {
        super({
            ownerId: ["243728573624614912"],
            allowedMentions: { parse: [] },
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_VOICE_STATES,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES
            ],
            makeCache: Options.cacheWithLimits({
                MessageManager: {
                    maxSize: 200,
                    sweepInterval: 180,
                    sweepFilter: Sweepers.filterByLifetime({
                        lifetime: 60
                    })
                },
                ThreadManager: {
                    sweepInterval: 3600,
                    sweepFilter: Sweepers.archivedThreadSweepFilter()
                }
            }),
            restTimeOffset: 300,
            retryLimit: 3,
            presence: {
                status: "online",
                activities: [
                    {
                        name: "/help | Huh?",
                        type: "COMPETING"
                    }
                ]
            }
        });
    }

    public start(): this {
        void this.listener.load();
        void this.login(
            this.config.devMode
                ? this.config.token.development
                : this.config.token.production
        );
        return this;
    }

    public async totalGuilds(): Promise<number | undefined> {
        if (!this.shard) return this.guilds.cache.size;
        const guilds = await this.shard.broadcastEval(
            client => client.guilds.cache.size
        );
        return guilds.reduce((a, b) => a + b, 0);
    }

    public async totalChannels(): Promise<number | undefined> {
        if (!this.shard) return this.channels.cache.size;
        const channels = await this.shard.broadcastEval(
            client => client.channels.cache.size
        );
        return channels.reduce((a, b) => a + b, 0);
    }

    public totalUsers(): number | undefined {
        if (!this.shard) return this.users.cache.size;
    }

    public totalPlaying(): number | undefined {
        if (!this.shard) return this.shoukaku.players.size;
    }

    public totalMemory(type: keyof NodeJS.MemoryUsageFn): string | undefined {
        const formatBytes = (bytes: number): string => {
            if (bytes === 0) return "0 Bytes";
            const sizes = [
                "Bytes",
                "KB",
                "MB",
                "GB",
                "TB",
                "PB",
                "EB",
                "ZB",
                "YB"
            ];
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${
                sizes[i]
            }`;
        };
        if (!this.shard) return formatBytes(process.memoryUsage[type]());
    }
}
