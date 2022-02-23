import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageButton, TextChannel } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "nuke",
    description: "Clear all ecosystem of the channel",
    usage: "nuke <channel[mention|id]>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_CHANNELS"],
    userPermissions: ["MANAGE_CHANNELS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "channel",
                type: "CHANNEL",
                description: "Channel who want to nuke",
                required: true
            }
        ]
    }
})
export default class NukeCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const channel = ctx.options?.getChannel("channel");
        if (channel instanceof TextChannel) {
            if (ctx.activateCollector) {
                await ctx.send({
                    embeds: [
                        createEmbed("info", "**please wait until the timeout over or response has given**")
                    ]
                }).then(x => void setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
                return undefined;
            }
            const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId("accept")
                        .setLabel("Accept")
                        .setStyle("SUCCESS"),
                    new MessageButton()
                        .setCustomId("decline")
                        .setLabel("Decline")
                        .setStyle("DANGER")
                );
            const send = await ctx.send({
                embeds: [
                    createEmbed("info", `**Are you sure to Nuke Channel \`${channel.name}\`?**`)
                ],
                components: [row]
            });
            ctx.activateCollector = true;
            const collector = send.createMessageComponentCollector({
                filter: x => ["accept", "decline"].includes(x.customId),
                time: 10000
            });
            collector.on("collect", int => {
                if (int.user.id !== ctx.author.id) {
                    return int.reply({
                        embeds: [
                            createEmbed("info", `**Sorry, but this interaction only for ${ctx.author.toString()}**`)
                        ],
                        ephemeral: true
                    });
                }
                if (int.customId === "accept") {
                    void ctx.send({
                        embeds: [
                            createEmbed("success", `**<a:accept:884700222951931964> | Nuke Channel **\`${channel.name}\`** successful!**`)
                        ],
                        components: []
                    }).then(x => setTimeout(() => x.delete().catch(() => null), 5000));
                    void channel.clone().then(x => {
                        void x.send({
                            embeds: [
                                createEmbed("info")
                                    .setAuthor({
                                        name: "Nothing in here, Nuke command successful!",
                                        iconURL: this.client.user!.displayAvatarURL()!
                                    })
                                    .setImage("https://cdn.discordapp.com/attachments/795512730940735508/801765196989071390/explosion.gif")
                                    .setTimestamp()
                                    .setFooter({
                                        text: `Commanded by: ${ctx.author.tag}`,
                                        iconURL: this.client.user!.displayAvatarURL({ dynamic: true })!
                                    })
                            ]
                        });
                    });
                    setTimeout(() => channel.delete().catch(() => null), 1000);
                } else {
                    void ctx.send({
                        embeds: [
                            createEmbed("error", `**<a:decline:879311910045097984> | Nuke Channel **\`${channel.name}\`** has canceled!**`)
                        ],
                        components: []
                    }).then(x => setTimeout(() => x.delete().catch(() => null), 5000));
                }
                ctx.activateCollector = false;
                void int.deferUpdate();
                collector.stop("finished");
            });
            collector.on("end", (_, reason) => {
                if (reason !== "finished") {
                    ctx.activateCollector = false;
                    void ctx.send({
                        embeds: [
                            createEmbed("error", "**The request has been canceled because no respond!**")
                        ],
                        components: []
                    }).then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
                }
            });
        } else {
            await ctx.send({
                embeds: [
                    createEmbed("info", "**Please input the valid Text Channel**")
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 5000)).catch(() => null);
        }
    }
}
