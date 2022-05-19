import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { MessageEmbed } from "discord.js";

type colortype = "error" | "info" | "success" | "warn";
const color: Record<colortype, `#${string}`> = {
    success: "#18d869",
    info: "#03fcfc",
    warn: "#FFFF00",
    error: "#FF0000"
};

export const createEmbed = (
    type?: colortype,
    message?: string
): MessageEmbed => {
    const embed = new MessageEmbed();
    if (type) embed.setColor(color[type]);
    if (message) embed.setDescription(message);
    return embed;
};

export const createMusicEmbed = (
    ctx: CommandContext,
    type?: colortype,
    author?: string,
    message?: string
): MessageEmbed => {
    const embed = new MessageEmbed();
    if (type) embed.setColor(color[type]);
    if (author)
        embed.setAuthor({
            name: author,
            iconURL: ctx.author.displayAvatarURL({ dynamic: true })
        });
    if (message) embed.setDescription(message);
    return embed;
};
