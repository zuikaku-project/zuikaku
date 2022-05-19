/* eslint-disable no-nested-ternary */
import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import {
    ICommandComponent,
    INPMRegistryAPI,
    INPMSearchAPI
} from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import dayjs from "dayjs";
import { MessageActionRow, MessageSelectMenu } from "discord.js";
import petitio from "petitio";

const { locale } = dayjs;
locale();

@ZuikakuDecorator<ICommandComponent>({
    name: "npm",
    description: "Get information about a package",
    usage: "npm {ABRACKETSL}query{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Name of module you want to see",
                required: true
            }
        ]
    }
})
export default class NPMCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        await this.getNodePackageModule(
            encodeURIComponent(ctx.options!.getString("query")!),
            ctx
        );
    }

    private async sendMessage(
        data: INPMRegistryAPI,
        ctx: CommandContext
    ): Promise<void> {
        const latest =
            data.versions[data["dist-tags"].latest as unknown as number];
        const npmLink = `[**NPM**](https://www.npmjs.com/package/${data.name})`;
        const homepageLink = latest.homepage
            ? `[**Homepage**](${latest.homepage})`
            : "";
        const repositoryLink = latest.repository
            ? `[**Repository**](${latest.repository.url.substring(
                  latest.repository.url.indexOf("+") + 1
              )})`
            : "";
        const bugsLink = latest.bugs ? `[**Bugs**](${latest.bugs.url})` : "";
        const dependencies = latest.dependencies;
        const devDependencies = latest.devDependencies;
        const Overview = createEmbed()
            .setColor("#cb3837")
            .setAuthor({
                name: "NPM Package",
                iconURL:
                    "https://images-ext-2.discordapp.net/external/3Cuh51nny9guvBRgO7FlskPbsaBIoZRbm4toUA9ba7U/https/i.imgur.com/ErKf5Y0.png",
                url: "https://www.npmjs.com/"
            })
            .setTitle(latest._id)
            .setURL(`https://www.npmjs.com/package/${latest.name}`)
            .setDescription(latest.description ?? "")
            .addFields([
                {
                    name: "Author",
                    value:
                        latest._npmUser?.name && latest._npmUser.email
                            ? `[**${latest._npmUser.name}**](https://www.npmjs.com/~${latest._npmUser.name}) (${latest._npmUser.email})`
                            : latest._npmUser?.name
                            ? `[**${latest._npmUser.name}**](https://www.npmjs.com/~${latest._npmUser.name})`
                            : "unknown"
                },
                {
                    name: "Maintainers",
                    value: latest.maintainers
                        .map(x => `[${x!.name ?? "unknown"}](${x!.url ?? ""})`)
                        .join("\n")
                },
                {
                    name: "License",
                    value: latest.license ?? "Not Licensed"
                },
                {
                    name: "\u200b",
                    value: `${npmLink} • ${homepageLink} • ${repositoryLink} • ${bugsLink}`
                }
            ]);
        const dependenciesEmbed = createEmbed("info")
            .setColor("#cb3837")
            .setAuthor({
                name: "NPM Package",
                iconURL:
                    "https://images-ext-2.discordapp.net/external/3Cuh51nny9guvBRgO7FlskPbsaBIoZRbm4toUA9ba7U/https/i.imgur.com/ErKf5Y0.png",
                url: "https://www.npmjs.com/"
            })
            .setTitle("Dependencies")
            .setURL(
                `https://www.npmjs.com/package/${latest.name}?activeTab=dependencies`
            )
            .setDescription(
                dependencies
                    ? Object.keys(dependencies)
                          .map(
                              x =>
                                  `[${x}](https://www.npmjs.com/package/${x}) \`v${dependencies[x]}\``
                          )
                          .join("\n")
                    : "None"
            )
            .addField(
                "\u200b",
                `${npmLink} • ${homepageLink} • ${repositoryLink} • ${bugsLink}`
            );
        const devDependenciesEmbed = createEmbed("info")
            .setColor("#cb3837")
            .setAuthor({
                name: "NPM Package",
                iconURL:
                    "https://images-ext-2.discordapp.net/external/3Cuh51nny9guvBRgO7FlskPbsaBIoZRbm4toUA9ba7U/https/i.imgur.com/ErKf5Y0.png",
                url: "https://www.npmjs.com/"
            })
            .setTitle("devDependencies")
            .setURL(
                `https://www.npmjs.com/package/${latest.name}?activeTab=dependencies`
            )
            .setDescription(
                devDependencies
                    ? Object.keys(devDependencies)
                          .map(
                              x =>
                                  `[${x}](https://www.npmjs.com/package/${x}) \`v${devDependencies[x]}\``
                          )
                          .join("\n")
                    : "None"
            )
            .addField(
                "\u200b",
                `${npmLink} • ${homepageLink} • ${repositoryLink} • ${bugsLink}`
            );
        const generatePagination = new this.client.utils.pagination(ctx, [
            Overview,
            dependenciesEmbed,
            devDependenciesEmbed
        ]);
        await generatePagination.selectMenuPagination([
            "Overview",
            "dependencies",
            "devDependencies"
        ]);
    }

    private async getNodePackageModule(
        query: string,
        ctx: CommandContext
    ): Promise<void> {
        const fetch = await petitio(
            `https://registry.npmjs.org/${query}`
        ).send();
        if (fetch.statusCode !== 200) {
            await this.searchNodePackageModule(query, ctx);
            return undefined;
        }
        const data = fetch.json<INPMRegistryAPI>();
        await this.sendMessage(data, ctx);
    }

    private async searchNodePackageModule(
        query: string,
        ctx: CommandContext
    ): Promise<void> {
        const fetch = await petitio(
            `https://registry.npmjs.org/-/v1/search?text=${query}`
        ).send();
        if (fetch.statusCode !== 200) return undefined;
        const data = fetch.json<INPMSearchAPI>();
        if (data.objects.length === 0) {
            await ctx.send({
                embeds: [
                    createEmbed(
                        "info",
                        "**<a:decline:879311910045097984> | Operation Canceled. 404 Not Found**"
                    )
                ]
            });
            return undefined;
        }
        await this.generateSelectMenus(data, ctx);
    }

    private async generateSelectMenus(
        data: INPMSearchAPI,
        ctx: CommandContext
    ): Promise<void> {
        const spliceData = data.objects.slice(0, 10).map((item, i) => ({
            label: item.package.name!,
            value: `${i++}`
        }));
        const rowSelectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("npm-select-menu")
                .setPlaceholder("Select a package")
                .setOptions(spliceData)
        );
        const sendMessage = await ctx.send({
            content: "ㅤ",
            components: [rowSelectMenu]
        });
        const collector = sendMessage.createMessageComponentCollector<3>({
            time: 30_000
        });
        collector.on("collect", async int => {
            if (int.user.id === ctx.author.id) {
                await int.deferUpdate();
                collector.stop("Finished");
                await this.getNodePackageModule(
                    data.objects[Number(int.values[0])].package.name!,
                    ctx
                );
            } else {
                await int.reply({
                    embeds: [
                        createEmbed(
                            "info",
                            `**Sorry, but this interaction only for ${ctx.author.toString()}**`
                        )
                    ],
                    ephemeral: true
                });
            }
        });
        collector.on("end", (_, reason) => {
            if (reason === "time") {
                const rowSelectMenuEnd = rowSelectMenu;
                (rowSelectMenuEnd.components[0] as MessageSelectMenu)
                    .setPlaceholder(
                        "This interaction has been disabled due to no respond"
                    )
                    .setDisabled();
                void ctx
                    .send({
                        content: "ㅤ",
                        components: [rowSelectMenuEnd]
                    })
                    .then(x =>
                        setTimeout(() => x.delete().catch(() => null), 5000)
                    )
                    .catch(() => null);
            }
        });
    }
}
