/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access */
import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "reload",
    description: "Reload slash command",
    usage: "reload ?{ABRACKETSL}slash{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    devOnly: true,
    slash: {
        options: [
            {
                name: "slash",
                description: "Slash command to reload",
                type: "STRING",
                required: true
            }
        ]
    }
})
export default class ReloadCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(true);
        try {
            await this.client.command.reloadSlash(
                ctx.options!.getString("slash")!
            );
            await ctx.send({
                embeds: [
                    createEmbed("info", "**Reload Slash Command Successful!**")
                ]
            });
        } catch (e: any) {
            await ctx.send({
                embeds: [
                    createEmbed(
                        "error",
                        `Operation Failed. Because: \n\`\`\`js${e.stack}\`\`\``
                    )
                ]
            });
        }
    }
}
