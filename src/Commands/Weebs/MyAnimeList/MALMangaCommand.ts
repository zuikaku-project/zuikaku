/* eslint-disable no-nested-ternary */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent, JikanMangaInterface } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "manga",
    description: "fetching manga information from MyAnimeList",
    usage: "{CATEGORY} myanimelist manga {ABRACKETSL}title{ABRACKETSR}",
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
export default class MALMangaCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const { data: getManga } = await this.client.apis.weebs.jikan.getManga(ctx.options!.getString("title")!);
        if (!getManga.length) {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**<a:decline:879311910045097984> | Operation Canceled. 404 Not Found**")
                ]
            });
            return undefined;
        }
        if (ctx.options?.getBoolean("search")) {
            await this.searchFlag(ctx, getManga);
            return undefined;
        }
        await this.sendMessage(ctx, getManga[0]);
    }

    private async sendMessage(ctx: CommandContext, final: JikanMangaInterface["data"][0]): Promise<void> {
        const firstEmbed = new MessageEmbed()
            .setColor("#2e51a1")
            .setAuthor({
                name: "MyAnimeList",
                iconURL: "https://images-ext-1.discordapp.net/external/9b2osjuxc7HKMDXbNHLEXlT-wTxnKUy4MBapcLnIV4s/https/i.ibb.co/D9g5b4s/myanimelist.png",
                url: "https://myanimelist.net/"
            })
            .setTitle(final.title)
            .setURL(final.url)
            .setDescription(
                [final.title, final.title_english, final.title_japanese, ...final.title_synonyms]
                    .filter(x => x !== final.title && Boolean(x))
                    .join("\n")
            )
            .setThumbnail(final.images.jpg.large_image_url)
            .addFields([
                {
                    name: "Genre",
                    value: final.genres.map(x => `[${x.name}](${x.url})`).join(", "),
                    inline: true
                },
                {
                    name: "Source",
                    value: final.type,
                    inline: true
                },
                {
                    name: "Score",
                    value: `⭐${final.scored} by ${final.scored_by} people`,
                    inline: true
                },
                {
                    name: "Published",
                    value: final.published.from && final.published.to
                        ? `<t:${(new Date(final.published.from).getTime() / 1000).toFixed(0)}:D> ` +
                        "to" +
                        ` <t:${(new Date(final.published.to).getTime() / 1000).toFixed(0)}:D>`
                        : final.published.from
                            ? `<t:${(new Date(final.published.from).getTime() / 1000).toFixed(0)}:D>`
                            : final.published.to
                                ? `<t:${(new Date(final.published.to).getTime() / 1000).toFixed(0)}:D>`
                                : "unknown",
                    inline: true
                },
                {
                    name: "Chapters",
                    value: final.chapters && final.volumes
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
            .setFooter({ text: `#${final.mal_id} ` });
        const secondEmbed = new MessageEmbed()
            .setColor("#2e51a1")
            .setAuthor({
                name: "MyAnimeList",
                iconURL: "https://images-ext-1.discordapp.net/external/9b2osjuxc7HKMDXbNHLEXlT-wTxnKUy4MBapcLnIV4s/https/i.ibb.co/D9g5b4s/myanimelist.png",
                url: "https://myanimelist.net/"
            })
            .setTitle(`${final.title} (${final.type})`)
            .setURL(final.url)
            .setDescription(final.synopsis)
            .setThumbnail(final.images.jpg.large_image_url)
            .setFooter({ text: `#${final.mal_id}` });
        const generatePagination = new this.client.utils.pagination(ctx, [firstEmbed, secondEmbed]);
        await generatePagination.selectMenuPagination(["Overview", "Description"]);
    }

    private async searchFlag(ctx: CommandContext, JikanMedia: JikanMangaInterface["data"]): Promise<void> {
        const mangaSlice = JikanMedia.map((x, i) => ({
            label: `${x.title.length > 90 ? `${x.title.substring(0, 90)}...` : x.title} [⭐${x.scored}]`,
            value: `${i++} `
        }));
        const rowSelectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(this.client.utils.encodeDecodeBase64String("Jikan-Manga"))
                    .setPlaceholder("Select an manga")
                    .setOptions(mangaSlice)
            );
        const send = await ctx.send({ content: "ㅤ", components: [rowSelectMenu] });
        const collector = send.createMessageComponentCollector({ time: 30_000 });
        collector.on("collect", async int => {
            if (int.isSelectMenu()) {
                await int.deferUpdate();
                if (int.user.id === ctx.author.id) {
                    collector.stop("Finished");
                    await this.sendMessage(ctx, JikanMedia[Number(int.values[0])]);
                } else {
                    await int.reply({
                        embeds: [
                            createEmbed("info", `** Sorry, but this interaction only for ${ctx.author.toString()} ** `)
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
                    .setPlaceholder("This interaction has been disabled due to no respond")
                    .setDisabled();
                void ctx.send({
                    content: "ㅤ",
                    components: [rowSelectMenuEnd]
                })
                    .then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
            }
        });
    }
}
