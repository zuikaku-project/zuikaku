import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { MessageActionRow, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "changelog",
    description: "Changelog Zuikaku",
    usage: "changelog",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {}
})
export default class ChangelogCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const changelogButton = new MessageActionRow().addComponents(
            new MessageButton()
                .setURL("https://zui.my.id/changelog")
                .setLabel("Changelog")
                .setStyle("LINK")
        );
        await ctx.send({
            embeds: [
                createEmbed("info").setAuthor({
                    name: "See my cangelog by click this button",
                    iconURL: this.client.user?.displayAvatarURL({
                        format: "png"
                    })
                })
            ],
            components: [changelogButton]
        });
    }
}
