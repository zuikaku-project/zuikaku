/* eslint-disable no-nested-ternary */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent, JikanAnimeInterface } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageEmbed, MessageSelectMenu } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "anime",
    description: "fetching anime information from MyAnimeList",
    usage: "anime <title>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "title",
                type: "STRING",
                description: "Title of the anime",
                required: true
            },
            {
                name: "search",
                type: "BOOLEAN",
                description: "Search anime"
            }
        ]
    }
})
export default class MALAnimeCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const { data: getAnime } = await this.client.apis.weebs.jikan.getAnime(ctx.options!.getString("title")!);
        if (!getAnime.length) {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**<a:decline:879311910045097984> | Operation Canceled. 404 Not Found**")
                ]
            });
            return undefined;
        }
        if (ctx.options?.getBoolean("search")) {
            await this.searchFlag(ctx, getAnime);
            return undefined;
        }
        await this.sendMessage(ctx, getAnime[0]);
    }

    private async sendMessage(ctx: CommandContext, final: JikanAnimeInterface["data"][0]): Promise<void> {
        const firstEmbed = new MessageEmbed()
            .setColor("#2e51a1")
            .setAuthor({
                name: "MyAnimeList",
                iconURL: "https://images-ext-1.discordapp.net/external/9b2osjuxc7HKMDXbNHLEXlT-wTxnKUy4MBapcLnIV4s/https/i.ibb.co/D9g5b4s/myanimelist.png",
                url: "https://myanimelist.net/"
            })
            .setTitle(`${final.title} (${final.type})`)
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
                    value: final.source,
                    inline: true
                },
                {
                    name: "Score",
                    value: `⭐${final.score} by ${final.scored_by} people`,
                    inline: true
                },
                {
                    name: "Aired",
                    value: final.aired.from && final.aired.to
                        ? `<t:${(new Date(final.aired.from).getTime() / 1000).toFixed(0)}:D> ` +
                        "to" +
                        ` <t:${(new Date(final.aired.to).getTime() / 1000).toFixed(0)}:D>`
                        : final.aired.from
                            ? `<t:${(new Date(final.aired.from).getTime() / 1000).toFixed(0)}:D>`
                            : final.aired.to
                                ? `<t:${(new Date(final.aired.to).getTime() / 1000).toFixed(0)}:D>`
                                : "unknown",
                    inline: true
                },
                {
                    name: "Episodes",
                    value: `${final.episodes} episodes\n(${final.duration})`,
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

    private async searchFlag(ctx: CommandContext, JikanMedia: JikanAnimeInterface["data"]): Promise<void> {
        const animeSlice = JikanMedia.map((x, i) => ({
            label: `${x.title.length > 90 ? `${x.title.substring(0, 90)}...` : x.title}[⭐${x.score}]`,
            value: `${i++} `
        }));
        const rowSelectMenu = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(this.client.utils.encodeDecodeBase64String("Jikan-Anime"))
                    .setPlaceholder("Select an anime")
                    .setOptions(animeSlice)
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
