import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuListener } from "@zuikaku/Structures/ZuikakuListener";
import { IListenerComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { Collection, Message, MessageActionRow, MessageButton, TextChannel, ThreadChannel } from "discord.js";

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
            !this.client.commands.isReady
        ) return;
        const getGuildDatabase = await this.client.database.guilds.get(message.guildId!);
        const channelGuildPlayer = this.client.channels.resolve(getGuildDatabase?.guildPlayer?.channelId ?? "");
        if (message.channelId === channelGuildPlayer?.id) {
            if (
                message.deletable &&
                message.author.id !== this.client.user?.id
            ) {
                await message.delete().catch(() => null);
            }
            const command = this.client.commands.find(x => x.meta.name === "play")!;
            if (!this.client.commands.cooldowns.has(command.meta.name)) {
                this.client.commands.cooldowns.set(command.meta.name, new Collection());
            }
            const now = Date.now();
            const timestamps = this.client.commands.cooldowns.get(command.meta.name);
            const cooldownAmount = (command.meta.cooldown ?? 3) * 1000;
            if (timestamps?.has(message.author.id)) {
                const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;
                if (now < expirationTime) {
                    const timeLeft = expirationTime - now;
                    if (timeLeft < 1) return undefined;
                    const timeoutmsg = await message.channel.send({
                        embeds: [
                            createEmbed("error", "Oof! you hit the cooldown. Please wait **" +
                                `\`${this.client.utils.parseMs(Number(timeLeft.toFixed(1)), { colonNotation: true }).colonNotation}\`**`)
                        ],
                        allowedMentions: {
                            repliedUser: true
                        }
                    });
                    setTimeout(() => timeoutmsg.delete().catch(() => null), 3000);
                    return undefined;
                }
                timestamps.set(message.author.id, now);
                setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
            } else {
                timestamps?.set(message.author.id, now);
                if (this.client.options.ownerId.includes(message.author.id)) {
                    timestamps?.delete(message.author.id);
                }
            }
            return command.execute(new CommandContext(this.client, message, message.content.split(/ +/g)));
        }

        if (
            message.channel instanceof TextChannel &&
            !message.channel.permissionsFor(this.client.user!.id)?.has("SEND_MESSAGES")
        ) return;
        if (
            message.channel instanceof ThreadChannel &&
            !message.channel.permissionsFor(this.client.user!.id)?.has("SEND_MESSAGES_IN_THREADS")
        ) return;
        if (
            this.getUserIdFromMention(message.content) === this.client.user?.id &&
            message.channelId !== channelGuildPlayer?.id
        ) {
            await message.channel.send({
                embeds: [
                    createEmbed("info")
                        .setAuthor({ name: "Zuikaku - Quick Help!", iconURL: this.client.user?.displayAvatarURL({ format: "png" }) })
                        .setDescription(
                            "The best Discord Bot that can serve you everytime\n" +
                            "Fast, Secure, Always on, Best Audio, and No Configuration\n"
                        )
                ],
                components: [
                    new MessageActionRow().addComponents(
                        new MessageButton()
                            .setURL("https://zuikaku-ship.maakoo.my.id")
                            .setEmoji(":Zuikaku_Icon:940586598800699413")
                            .setLabel("Website")
                            .setStyle("LINK")
                    )
                ]
            });
        }
    }

    private getUserIdFromMention(mention: string): string | undefined {
        const matches = (/^<@!?(?<id>(?:\d+))>$/).exec(mention);
        if (!matches) return undefined;
        return matches.groups!.id;
    }
}
