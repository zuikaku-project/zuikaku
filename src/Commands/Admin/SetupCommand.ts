/* eslint-disable @typescript-eslint/no-base-to-string */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { Message, MessageActionRow, MessageButton, TextChannel } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "setup",
    description: "Create or Delete guild player",
    usage: "{CATEGORY} setup create|delete ?{ABRACKETSL}channel{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    userPermissions: ["MANAGE_GUILD"],
    slash: {
        type: "SUB_COMMAND_GROUP",
        options: [
            {
                name: "create",
                type: "SUB_COMMAND",
                description: "Create Guild Player",
                options: [
                    {
                        name: "channel",
                        type: "CHANNEL",
                        description: "Channel Guild Player",
                        required: true
                    }
                ]
            },
            {
                name: "delete",
                type: "SUB_COMMAND",
                description: "Delete Guild Player"
            }
        ]
    }
})
export default class SetupCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id);
        if (ctx.options?.getSubcommand(false) === "delete") {
            const getGuildDatabase = await this.client.database.entity.guilds.get(ctx.guild!.id);
            const alreadySet = this.client.channels.resolve(getGuildDatabase?.guildPlayer?.channelId ?? "");
            if (alreadySet) {
                (await (alreadySet as TextChannel).messages
                    .fetch(getGuildDatabase?.guildPlayer?.messageId ?? "")
                    .catch(() => null))?.delete().catch(() => null);
                if (queue) {
                    await this.client.database.entity.guilds.reset(ctx.guild!.id, "guildPlayer");
                } else {
                    await this.client.database.entity.guilds.drop(ctx.guild!.id);
                }
                await ctx.send({
                    embeds: [
                        createEmbed("info", "**<a:accept:884700222951931964> | the Guild Player has been deleted in this server**")
                    ]
                });
            } else {
                await ctx.send({
                    embeds: [
                        createEmbed(
                            "info",
                            "**<a:decline:879311910045097984> | Operation Canceled. the Guild Player is not setup in this server**"
                        )
                    ]
                });
            }
        } else {
            const getGuildDatabase = await this.client.database.entity.guilds.set(
                ctx.guild!.id,
                "guildPlayer",
                {
                    channelId: null,
                    messageId: null
                }
            );
            const channel = ctx.options?.getChannel("channel");
            if (channel instanceof TextChannel) {
                const missing = channel.permissionsFor(this.client.user!.id)?.missing(["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_MESSAGES"]);
                if (missing!.length) {
                    await ctx.send({
                        embeds: [
                            createEmbed(
                                "info",
                                "**<a:decline:879311910045097984> | Operation Canceled. " +
                                `Make sure that channel have permission [\`${missing!.join(", ")}\`] for me.**`
                            )
                        ]
                    });
                    return;
                }
                const alreadySet = this.client.channels.resolve(getGuildDatabase.guildPlayer!.channelId);
                if (alreadySet) {
                    const messageGuildPlayer = await (alreadySet as TextChannel).messages
                        .fetch(getGuildDatabase.guildPlayer!.messageId)
                        .catch(() => undefined);
                    if (messageGuildPlayer) {
                        await ctx.send({
                            embeds: [
                                createEmbed(
                                    "info",
                                    "**<a:decline:879311910045097984> | Operation Canceled. " +
                                    `Guild Player already setup in ${alreadySet.toString()}**`
                                )
                            ]
                        });
                    } else {
                        const msg = await this.setup(channel);
                        await this.client.database.entity.guilds.set(
                            ctx.guild!.id,
                            "guildPlayer",
                            {
                                channelId: channel.id,
                                messageId: msg.id
                            }
                        );
                        await ctx.send({
                            embeds: [
                                createEmbed(
                                    "info",
                                    `**<a:accept:884700222951931964> | Guild Player has been setup to channel ${channel.toString()}**`
                                )
                            ]
                        });
                    }
                    return;
                }
                const msg = await this.setup(channel);
                await this.client.database.entity.guilds.set(
                    ctx.guild!.id,
                    "guildPlayer",
                    {
                        channelId: channel.id,
                        messageId: msg.id
                    }
                );
                if (queue) {
                    queue.textId = (msg.channel as TextChannel).id;
                    setTimeout(() => this.client.shoukaku.updateGuildPlayerEmbed(ctx.guild!), 500);
                }
                await ctx.send({
                    embeds: [
                        createEmbed(
                            "info",
                            `**<a:accept:884700222951931964> | Guild Player has been setup to channel ${channel.toString()}**`
                        )
                    ]
                });
            } else {
                await ctx.send({
                    embeds: [
                        createEmbed(
                            "info",
                            "**<a:decline:879311910045097984> | Operation Canceled. Please input the valid Text Channel**"
                        )
                    ]
                });
            }
        }
    }

    private async setup(channel: TextChannel): Promise<Message> {
        return channel.send({
            embeds: [
                createEmbed("info")
                    .setAuthor({
                        name: "Nothing are playing rightnow",
                        iconURL: this.client.user?.displayAvatarURL({ format: "png", size: 4096 })
                    })
                    .setImage("https://cdn.discordapp.com/attachments/795512730940735508/857506653028614174/thumb-1920-744946.png")
                    .setFooter({ text: "Zuikaku-ship " })
            ],
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setEmoji(":stop:891234533834383391")
                            .setStyle("PRIMARY")
                            .setCustomId(this.client.utils.encodeDecodeBase64String("Player_STOP"))
                            .setDisabled(true),
                        new MessageButton()
                            .setEmoji(":play_pause:891234223736897546")
                            .setStyle("PRIMARY")
                            .setCustomId(this.client.utils.encodeDecodeBase64String("Player_PLAY-PAUSE"))
                            .setDisabled(true),
                        new MessageButton()
                            .setEmoji(":next_track:891234301864202241")
                            .setStyle("PRIMARY")
                            .setCustomId(this.client.utils.encodeDecodeBase64String("Player_NEXT-TRACK"))
                            .setDisabled(true),
                        new MessageButton()
                            .setEmoji(":shuffle:891234382097031168")
                            .setStyle("PRIMARY")
                            .setCustomId(this.client.utils.encodeDecodeBase64String("Player_REPEAT"))
                            .setDisabled(true),
                        new MessageButton()
                            .setEmoji(":repeat:891234461239357471")
                            .setStyle("PRIMARY")
                            .setCustomId(this.client.utils.encodeDecodeBase64String("Player_SHUFFLE"))
                            .setDisabled(true)
                    )
            ]
        });
    }
}
