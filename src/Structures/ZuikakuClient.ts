import {
    AnilistManager,
    CanvasHandler,
    CommandHandler,
    GuildDatabaseManager,
    JikanManager,
    ListenerHandler,
    ShoukakuHandler,
    TopggHandler,
    UserDatabaseManager,
    WeebyManager
} from "@zuikaku/Handlers";
import { Logger, Utils } from "@zuikaku/Utils";
import { Client, Intents, Options, Sweepers } from "discord.js";
import { join, resolve } from "node:path";
import process from "node:process";
import { DataSource } from "typeorm";

const config = Utils.parseYaml(join(__dirname, "../../ZuikakuConfig.yaml"));

export class ZuikakuClient extends Client {
    public constructor() {
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
        Object.defineProperty(this, "config", {
            value: config
        });
        Object.defineProperty(this, "snipe", {
            value: new Map()
        });
        Object.defineProperty(this, "logger", {
            value: new Logger()
        });
        Object.defineProperty(this, "utils", {
            value: new Utils()
        });
        Object.defineProperty(this, "apis", {
            value: {
                canvas: new CanvasHandler(this),
                dbl: new TopggHandler(this),
                weebs: {
                    anilist: new AnilistManager(),
                    jikan: new JikanManager(),
                    weeby: new WeebyManager()
                }
            }
        });
        Object.defineProperty(this, "shoukaku", {
            value: new ShoukakuHandler(this)
        });
        Object.defineProperty(this, "database", {
            value: {
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
            }
        });
        Object.defineProperty(this, "listeners", {
            value: new ListenerHandler(this, resolve(__dirname, "../Listeners"))
        });
        Object.defineProperty(this, "commands", {
            value: new CommandHandler(this, resolve(__dirname, "../Commands"))
        });
    }

    public start(): this {
        void this.listeners.load();
        if (this.config.devMode) {
            void this.login(
                "OTExMTQ3Mjg5NzMxNTQzMDky.YZdKCg.HyKyzRHUHtREREVpG5Pj0QJzRgk"
            );
        } else {
            void this.login(
                "NzkxMjcxMjIzMDc3MTA5ODIw.X-MuwA.XTpdWsnWaAt3Qm7qGqkQr7zL3cM"
            );
        }
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
