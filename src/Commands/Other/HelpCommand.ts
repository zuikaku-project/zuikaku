import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "help",
    description: "Help Command",
    usage: "help [command]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "command",
                description: "Display specifix commands",
                type: "STRING",
                required: false,
                autocomplete: true
            }
        ]
    }
})
export default class HelpCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const findCommand = this.client.command.find(
            x => x.meta.name === ctx.options!.getString("command")!
        );
        const helpEmbed = createEmbed("info");
        if (findCommand) {
            helpEmbed
                .setAuthor({
                    name: `${this.client.user!.username} • Help Command`,
                    iconURL: this.client.user!.displayAvatarURL({
                        size: 4096,
                        format: "png"
                    })!
                })
                .setFooter({
                    text: "ℹ️ Don't include <> or []. It's mean, <> is required and [] is optional"
                })
                .addFields([
                    {
                        name: "Command Name",
                        value: findCommand.meta.name
                    },
                    {
                        name: "Description",
                        value: findCommand.meta.description!
                    },
                    {
                        name: "Usage",
                        value:
                            findCommand.meta.category === "other"
                                ? `/${findCommand.meta.usage ?? ""}`
                                : `/${
                                      findCommand.meta.usage
                                          ?.replace(
                                              "{CATEGORY}",
                                              findCommand.meta.category!
                                          )
                                          .replace(/{ABRACKETSL}/g, "<")
                                          .replace(/{ABRACKETSR}/g, ">") ?? ""
                                  }`
                    }
                ]);
            await ctx.send({
                embeds: [helpEmbed],
                deleteButton: {
                    reference: ctx.author.id
                }
            });
        } else if (ctx.options?.getString("command")) {
            await ctx.send({
                embeds: [
                    helpEmbed
                        .setDescription(
                            "**<a:decline:879311910045097984> | Operation Canceled. Invalid Command**"
                        )
                        .setFooter({
                            text: "ℹ️ Don't include <> or []. It's mean, <> is required and [] is optional"
                        })
                ],
                deleteButton: {
                    reference: ctx.author.id
                }
            });
        } else {
            const othersCommand: string[] = [];
            Object.values(this.client.command.categories)
                .map(x => x!.filter(Boolean))
                .sort((a, b) =>
                    a[0].meta.category!.localeCompare(
                        b[0].meta.category!,
                        "en",
                        {
                            sensitivity: "base"
                        }
                    )
                )
                .map(command => {
                    const category = command[0].meta.category;
                    const cmds = command
                        .map(x => `**\`${x.meta.name}\`**`)
                        .join(", ");
                    if (category === "action") {
                        helpEmbed.addField(
                            "• Action Commands: /action <commands>",
                            cmds
                        );
                    } else if (category === "admin") {
                        helpEmbed.addField(
                            "• Admin Commands: /admin <commands>",
                            cmds
                        );
                    } else if (category === "anilist") {
                        helpEmbed.addField(
                            "• Anilist Commands: /anilist <commands>",
                            cmds
                        );
                    } else if (category === "animal") {
                        helpEmbed.addField(
                            "• Animal Commands: /animal <commands>",
                            cmds
                        );
                    } else if (category === "image") {
                        helpEmbed.addField(
                            "• Image Commands: /image <commands>",
                            cmds
                        );
                    } else if (category === "music") {
                        helpEmbed.addField(
                            "• Music Commands: /music <commands>",
                            cmds
                        );
                    } else if (category === "music-filter") {
                        helpEmbed.addField(
                            "• Music Filter Commands: /music-filter <commands>",
                            cmds
                        );
                    } else if (category === "myanimelist") {
                        helpEmbed.addField(
                            "• MyAnimeList Commands: /myanimelist <commands>",
                            cmds
                        );
                    } else if (category === "playlist") {
                        helpEmbed.addField(
                            "• Playlist Commands: /playlist <commands>",
                            cmds
                        );
                    } else {
                        othersCommand.push(cmds);
                    }
                });
            helpEmbed
                .addField(
                    "• Other Commands: /<commands>",
                    othersCommand.reduce((a, b) => `${a}, ${b}`)
                )
                .setAuthor({
                    name: this.client.user!.username,
                    iconURL: this.client.user!.displayAvatarURL({
                        size: 4096,
                        format: "png"
                    })!
                })
                .setDescription(
                    "Type **`/help [command]`** to get how to use the command\n\u200b"
                )
                .setThumbnail(
                    this.client.user!.displayAvatarURL({
                        size: 4096,
                        format: "png"
                    })!
                );
            const row = new MessageActionRow().addComponents([
                new MessageButton()
                    .setURL(
                        "https://discord.com/oauth2/authorize?client_id=791271223077109820&scope=bot%20applications.commands&permissions=412353949014"
                    )
                    .setLabel("Invite Me")
                    .setStyle("LINK"),
                new MessageButton()
                    .setURL("https://top.gg/bot/791271223077109820/vote")
                    .setLabel("Vote Me")
                    .setStyle("LINK")
            ]);
            await ctx.send({
                embeds: [helpEmbed],
                components: [row],
                deleteButton: {
                    reference: ctx.author.id
                }
            });
        }
    }
}
