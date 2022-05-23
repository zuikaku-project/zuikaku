/* eslint-disable max-lines */
import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import { ICommandComponent } from "#zuikaku/types/core";
import { Utils } from "#zuikaku/Utils";
import { ApplicationCommandData, Collection, Snowflake } from "discord.js";
import { resolve } from "node:path";

export class CommandHandler extends Collection<string, ICommandComponent> {
    public isReady = false;
    public categories!: Record<
        | "action"
        | "admin"
        | "anilist"
        | "animal"
        | "image"
        | "music-filter"
        | "music"
        | "myanimelist"
        | "other"
        | "playlist",
        ICommandComponent[] | undefined
    >;

    public readonly aliases: Collection<string, string> = new Collection();
    public readonly cooldowns: Collection<
        string,
        Collection<Snowflake, number>
    > = new Collection();

    public subCommandsAction = {
        name: "action",
        description: "Action Command(s)",
        options: [] as any[]
    };

    public subCommandsAdmin = {
        name: "admin",
        description: "Admin Command(s)",
        options: [] as any[]
    };

    public subCommandsAnilist = {
        name: "anilist",
        description: "Anilist Command(s)",
        options: [] as any[]
    };

    public subCommandsAnimal = {
        name: "animal",
        description: "Animal Command(s)",
        options: [] as any[]
    };

    public subCommandsFilter = {
        name: "music-filter",
        description: "Filter Command(s)",
        options: [] as any[]
    };

    public subCommandsImage = {
        name: "image",
        description: "Image Command(s)",
        options: [] as any[]
    };

    public subCommandsMyAnimeList = {
        name: "myanimelist",
        description: "MyAnimeList Command(s)",
        options: [] as any[]
    };

    public subCommandsMusic = {
        name: "music",
        description: "Music Command(s)",
        options: [] as any[]
    };

    public subCommandsPlaylist = {
        name: "playlist",
        description: "Playlist Command(s)",
        options: [] as any[]
    };

    public constructor(
        public client: ZuikakuClient,
        private readonly path: string
    ) {
        super();
    }

    public async load(): Promise<void> {
        const commands = Utils.readdirRecursive(this.path);
        let disabledCount = 0;
        try {
            this.client.logger.info(
                "command handler",
                `Found ${commands.length} command(s). Registering...`
            );
            const allCmd = [
                ...(await this.client.application!.commands.fetch()).values()
            ];
            for (const files of commands) {
                const command = await Utils.import<ICommandComponent>(
                    resolve(files),
                    this.client
                );
                if (command === undefined) {
                    this.client.logger.error(
                        "router handler",
                        `File ${files} is not valid router file`
                    );
                    disabledCount++;
                    continue;
                }
                const category = files
                    .split(/\/|\\/g)
                    .slice(0, -1)
                    .pop()!
                    .toLowerCase();
                const path = files;
                Object.freeze(Object.assign(command.meta, { category, path }));
                this.set(
                    Utils.encodeDecodeBase64String(
                        `${command.meta.category!}.${command.meta.name}`
                    ),
                    command
                );
                if (command.meta.contextChat) {
                    if (command.meta.devOnly) {
                        this.client.config.devGuild
                            .map(guildId =>
                                this.client.guilds.cache.get(guildId)
                            )
                            .map(
                                guild =>
                                    guild?.commands.cache.find(
                                        x => x.name === command.meta.contextChat
                                    ) ??
                                    guild?.commands.create({
                                        name: command.meta.contextChat!,
                                        type: "MESSAGE"
                                    })
                            );
                    }
                    if (allCmd.find(x => x.name === command.meta.contextChat)) {
                        await this.client.application?.commands.create({
                            name: command.meta.contextChat,
                            type: "MESSAGE"
                        });
                    }
                }
                if (command.meta.slash) {
                    if (!command.meta.slash.name) {
                        Object.assign(command.meta.slash, {
                            name: command.meta.name
                        });
                    }
                    if (!command.meta.slash.description) {
                        Object.assign(command.meta.slash, {
                            description: command.meta.description
                        });
                    }
                    if (command.meta.category === "action") {
                        this.subCommandsAction.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "admin") {
                        this.subCommandsAdmin.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "anilist") {
                        this.subCommandsAnilist.options.push(
                            command.meta.slash
                        );
                    }
                    if (command.meta.category === "animal") {
                        this.subCommandsAnimal.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "image") {
                        this.subCommandsImage.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "myanimelist") {
                        this.subCommandsMyAnimeList.options.push(
                            command.meta.slash
                        );
                    }
                    if (command.meta.category === "music-filter") {
                        this.subCommandsFilter.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "music") {
                        this.subCommandsMusic.options.push(command.meta.slash);
                    }
                    if (command.meta.category === "playlist") {
                        this.subCommandsPlaylist.options.push(
                            command.meta.slash
                        );
                    }
                    if (
                        !allCmd.find(x => x.name === command.meta.name) &&
                        ![
                            "animal",
                            "action",
                            "image",
                            "music-filter",
                            "music",
                            "admin",
                            "playlist",
                            "anilist",
                            "myanimelist"
                        ].includes(command.meta.category!)
                    ) {
                        if (command.meta.devOnly) {
                            this.client.config.devGuild.map(x =>
                                this.client.guilds.cache
                                    .get(x)
                                    ?.commands.create(
                                        command.meta
                                            .slash as ApplicationCommandData
                                    )
                                    .catch(() => null)
                            );
                        } else {
                            await this.client.application?.commands
                                .create(
                                    command.meta.slash as ApplicationCommandData
                                )
                                .catch(() => null);
                        }
                    }
                }
                if (command.meta.disable) disabledCount++;
            }
            if (
                !allCmd.find(x => x.name === "action") &&
                this.subCommandsAction.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsAction)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "admin") &&
                this.subCommandsAdmin.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsAdmin)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "anilist") &&
                this.subCommandsAnilist.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsAnilist)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "animal") &&
                this.subCommandsAnimal.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsAnimal)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "image") &&
                this.subCommandsImage.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsImage)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "myanimelist") &&
                this.subCommandsMyAnimeList.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsMyAnimeList)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "music-filter") &&
                this.subCommandsFilter.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsFilter)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "music") &&
                this.subCommandsMusic.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsMusic)
                    .catch(() => null);
            }
            if (
                !allCmd.find(x => x.name === "playlist") &&
                this.subCommandsPlaylist.options.length
            ) {
                await this.client.application?.commands
                    .create(this.subCommandsPlaylist)
                    .catch(() => null);
            }
        } catch (err) {
            this.client.logger.error(
                "command handler",
                `COMMAND_LOADER_ERR: `,
                (err as Error).stack ?? (err as Error).message
            );
        } finally {
            this.categories = this.reduce<
                Record<string, ICommandComponent[] | undefined>
            >((a, b) => {
                a[b.meta.category!] = a[b.meta.category!] ?? [];
                a[b.meta.category!]?.push(b);
                return a;
            }, {});
            this.isReady = true;
            this.client.logger.info(
                "command handler",
                `Done Registering ${commands.length} command(s).`
            );
            if (disabledCount !== 0) {
                this.client.logger.info(
                    "command handler",
                    `Found ${disabledCount}/${commands.length} commands(s) is disable.`
                );
            }
        }
    }

    public async reloadSlash(slash: string): Promise<void> {
        const allCmd = [
            ...(await this.client.application!.commands.fetch()).values()
        ];
        const slashLowercase = slash.toLowerCase();
        const getSlashCommand = allCmd.find(x => x.name === slashLowercase);
        if (getSlashCommand) {
            const findSlashWithCommandName = this.find(
                ({ meta }) => meta.name === slashLowercase
            );
            if (findSlashWithCommandName) {
                await getSlashCommand.edit(
                    findSlashWithCommandName.meta
                        .slash as ApplicationCommandData
                );
            }
            if (this.subCommandsAction.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsAction);
            }
            if (this.subCommandsAdmin.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsAdmin);
            }
            if (this.subCommandsAnilist.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsAnilist);
            }
            if (this.subCommandsAnimal.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsAnimal);
            }
            if (this.subCommandsFilter.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsFilter);
            }
            if (this.subCommandsImage.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsImage);
            }
            if (this.subCommandsMusic.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsMusic);
            }
            if (this.subCommandsMyAnimeList.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsMyAnimeList);
            }
            if (this.subCommandsPlaylist.name === slashLowercase) {
                await getSlashCommand.edit(this.subCommandsPlaylist);
            }
        }
    }
}
