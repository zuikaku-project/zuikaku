/* eslint-disable no-nested-ternary */
import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { AnilistAnimeMangaInterface, ICommandComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "manga",
    description: "fetching manga information from Anilist",
    usage: "{CATEGORY} manga {ABRACKETSL}title{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "title",
                type: "STRING",
                description: "Title of the manga",
                required: true
            },
            {
                name: "search",
                type: "BOOLEAN",
                description: "Search manga"
            }
        ]
    }
})
export default class AnilistMangaCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const { data: getManga } =
            await this.client.apis.weebs.anilist.getManga(
                ctx.options!.getString("title")!
            );
        if (!getManga.Page.media.length) {
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
        if (ctx.options?.getBoolean("search")) {
            await this.searchFlag(ctx, getManga.Page.media);
            return undefined;
        }
        await this.sendMessage(ctx, getManga.Page.media[0]);
    }

    private async sendMessage(
        ctx: CommandContext,
        final: AnilistAnimeMangaInterface["data"]["Page"]["media"][0]
    ): Promise<void> {
        let startDate = new Date(
            `${final.startDate.month}/${final.startDate.day}/${final.startDate.year}`
        ) as Date | null;
        if (startDate instanceof Date && isNaN(startDate.getTime())) {
            startDate = null;
        }
        let endDate = new Date(
            `${final.endDate.month}/${final.endDate.day}/${final.endDate.year}`
        ) as Date | null;
        if (endDate instanceof Date && isNaN(endDate.getTime())) {
            endDate = null;
        }
        const firstEmbed = new MessageEmbed()
            .setColor("#19202d")
            .setAuthor({
                name: "Anilist",
                iconURL:
                    "https://images-ext-1.discordapp.net/external/fmc-1fTgueco7kCb6o6Y5oReHjP8ygl1oNFrd7kSZdA/https/i.ibb.co/vYBvP34/anilist.png",
                url: "https://anilist.co/"
            })
            .setTitle(`${final.title.romaji} (${final.format})`)
            .setURL(final.siteUrl)
            .setDescription(
                [...Object.values(final.title).slice(1), ...final.synonyms]
                    .filter(x => x !== final.title.romaji && Boolean(x))
                    .join("\n")
            )
            .setImage(final.bannerImage)
            .setThumbnail(final.coverImage.large)
            .addFields([
                {
                    name: "Genre",
                    value: final.genres.length
                        ? final.genres
                              .map(
                                  x =>
                                      `[${x}](https://anilist.co/search/manga/${encodeURIComponent(
                                          x
                                      )})`
                              )
                              .join(", ")
                        : "ㅤ",
                    inline: true
                },
                {
                    name: "Source",
                    value: final.source,
                    inline: true
                },
                {
                    name: "Score",
                    value: `Average: ${final.averageScore}%\nMean: ${final.meanScore}%`,
                    inline: true
                },
                {
                    name: "Published",
                    value:
                        startDate && endDate
                            ? `<t:${(startDate.getTime() / 1000).toFixed(
                                  0
                              )}:D> ` +
                              "to" +
                              ` <t:${(endDate.getTime() / 1000).toFixed(0)}:D>`
                            : startDate
                            ? `<t:${(startDate.getTime() / 1000).toFixed(0)}:D>`
                            : endDate
                            ? `<t:${(endDate.getTime() / 1000).toFixed(0)}:D>`
                            : "unknown",
                    inline: true
                },
                {
                    name: "Chapters",
                    value:
                        final.chapters && final.volumes
                            ? `${final.chapters} chapters and ${final.volumes}`
                            : final.chapters
                            ? `${final.chapters} chapters`
                            : final.volumes
                            ? `${final.volumes} volumes`
                            : "unknown",
                    inline: true
                },
                {
                    name: "Status",
                    value: final.status,
                    inline: true
                }
            ])
            .setFooter({ text: `#${final.id} ` });
        const secondEmbed = new MessageEmbed()
            .setColor("#19202d")
            .setAuthor({
                name: "Anilist",
                iconURL:
                    "https://images-ext-1.discordapp.net/external/fmc-1fTgueco7kCb6o6Y5oReHjP8ygl1oNFrd7kSZdA/https/i.ibb.co/vYBvP34/anilist.png",
                url: "https://anilist.co/"
            })
            .setTitle(`${final.title.romaji} (${final.format})`)
            .setURL(final.siteUrl)
            .setDescription(final.description)
            .setThumbnail(final.coverImage.large)
            .setImage(final.bannerImage)
            .setFooter({ text: `#${final.id} ` });
        const generatePagination = new this.client.utils.pagination(ctx, [
            firstEmbed,
            secondEmbed
        ]);
        await generatePagination.selectMenuPagination([
            "Overview",
            "Description"
        ]);
    }

    private async searchFlag(
        ctx: CommandContext,
        AnilistMedia: AnilistAnimeMangaInterface["data"]["Page"]["media"]
    ): Promise<void> {
        const mangaSlice = AnilistMedia.map((x, i) => ({
            label: `${
                x.title.romaji.length > 90
                    ? `${x.title.romaji.substring(0, 90)}...`
                    : x.title.romaji
            }`,
            value: `${i++}`
        }));
        const rowSelectMenu = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId(Utils.encodeDecodeBase64String("Anilist-Manga"))
                .setPlaceholder("Select an manga")
                .setOptions(mangaSlice)
        );
        const send = await ctx.send({
            content: "ㅤ",
            components: [rowSelectMenu]
        });
        const collector = send.createMessageComponentCollector({
            time: 30_000
        });
        collector.on("collect", async int => {
            if (int.isSelectMenu()) {
                await int.deferUpdate();
                if (int.user.id === ctx.author.id) {
                    collector.stop("Finished");
                    await this.sendMessage(
                        ctx,
                        AnilistMedia[Number(int.values[0])]
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
            }
        });
        collector.on("end", (_, reason) => {
            if (reason !== "Finished") {
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
