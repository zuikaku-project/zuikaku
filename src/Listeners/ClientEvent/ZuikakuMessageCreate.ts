import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import {
    Collection,
    Message,
    MessageActionRow,
    MessageButton,
    TextChannel,
    ThreadChannel
} from "discord.js";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuMessageCreate",
    event: "messageCreate",
    emitter: "client"
})
export default class ZuikakuMessageCreate extends ZuikakuListener {
    public async execute(message: Message): Promise<void> {
        if (
            message.author.bot ||
            message.channel.type === "DM" ||
            !this.client.command.isReady
        )
            return;
        const embedPlayer = this.client.shoukaku.embedPlayers.get(
            message.guildId!
        );
        if (message.channelId === embedPlayer?.channel?.id) {
            if (message.author.id !== this.client.user?.id) {
                await message.delete().catch(() => null);
            }
            const command = this.client.command.find(
                x => x.meta.name === "play"
            )!;
            if (!this.client.command.cooldowns.has(command.meta.name)) {
                this.client.command.cooldowns.set(
                    command.meta.name,
                    new Collection()
                );
            }
            const now = Date.now();
            const timestamps = this.client.command.cooldowns.get(
                command.meta.name
            );
            const cooldownAmount = (command.meta.cooldown ?? 3) * 1000;
            if (timestamps?.has(message.author.id)) {
                const expirationTime =
                    timestamps.get(message.author.id)! + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = expirationTime - now;
                    if (timeLeft < 1) return undefined;
                    const timeoutmsg = await message.channel.send({
                        embeds: [
                            createEmbed(
                                "error",
                                "Oof! you hit the cooldown. Please wait **" +
                                    `\`${
                                        Utils.parseMs(
                                            Number(timeLeft.toFixed(1)),
                                            {
                                                colonNotation: true
                                            }
                                        ).colonNotation
                                    }\`**`
                            )
                        ],
                        allowedMentions: {
                            repliedUser: true
                        }
                    });
                    setTimeout(
                        () => timeoutmsg.delete().catch(() => null),
                        3000
                    );
                    return undefined;
                }
                timestamps.set(message.author.id, now);
                setTimeout(
                    () => timestamps.delete(message.author.id),
                    cooldownAmount
                );
            } else {
                timestamps?.set(message.author.id, now);
                if (this.client.options.ownerId.includes(message.author.id)) {
                    timestamps?.delete(message.author.id);
                }
            }
            await command.execute(
                new CommandContext(
                    this.client,
                    message,
                    message.content.split(/ +/g)
                )
            );
            return this.client.logger.info(
                "command manager",
                `${message.member!.user.tag} •> ` +
                    `${command.meta.name} <•> ` +
                    `${message.guild!.name} <•> ` +
                    `#${(message.channel as TextChannel).name}`
            );
        }

        if (
            message.channel instanceof TextChannel &&
            !message.channel
                .permissionsFor(this.client.user!.id)
                ?.has("SEND_MESSAGES")
        )
            return;
        if (
            message.channel instanceof ThreadChannel &&
            !message.channel
                .permissionsFor(this.client.user!.id)
                ?.has("SEND_MESSAGES_IN_THREADS")
        )
            return;
        if (
            this.getUserIdFromMention(message.content) ===
                this.client.user?.id &&
            message.channelId !== embedPlayer?.channel?.id
        ) {
            await message.channel.send({
                embeds: [
                    createEmbed("info")
                        .setAuthor({
                            name: "Zuikaku - Quick Help!",
                            iconURL: this.client.user?.displayAvatarURL({
                                format: "png"
                            })
                        })
                        .setDescription(
                            "Your Powerful Discord Aircraft Carrier with Many Features"
                        )
                ],
                components: [
                    new MessageActionRow().addComponents(
                        new MessageButton()
                            .setURL("https://zui.my.id/")
                            .setEmoji(":Zuikaku_Icon:940586598800699413")
                            .setLabel("Website")
                            .setStyle("LINK")
                    )
                ]
            });
        }
    }

    private getUserIdFromMention(mention: string): string | undefined {
        const matches = /^<@!?(?<id>(?:\d+))>$/.exec(mention);
        if (!matches) return undefined;
        return matches.groups!.id;
    }
}
