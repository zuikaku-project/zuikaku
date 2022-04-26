import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "sadcat",
    description: "Random saddest cat picture",
    usage: "{CATEGORY} sadcat",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class SadcatCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const { file } = await petitio(
            "https://api.alexflipnote.dev/sadcat"
        ).json();
        const ath = new MessageAttachment(file as string, "sadcat.png");
        const e = createEmbed("info")
            .setAuthor({ name: `😿| I need your hug ${ctx.author.username}` })
            .setImage("attachment://sadcat.png")
            .setTimestamp()
            .setFooter({
                text: `Commanded by ${ctx.author.tag}`,
                iconURL: ctx.author.displayAvatarURL({ dynamic: true })!
            });
        await ctx.send({ embeds: [e], files: [ath] });
    }
}
