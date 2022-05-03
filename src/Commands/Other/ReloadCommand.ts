/* eslint-disable @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "reload",
    description: "Reload slash/file command",
    usage: "reload slash|command ?{ABRACKETSL}slash{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    devOnly: true,
    slash: {
        options: [
            {
                name: "slash",
                description: "Reload Slash Command",
                type: "SUB_COMMAND",
                options: [
                    {
                        name: "slash",
                        description: "Reload slash:",
                        type: "STRING",
                        required: true
                    }
                ]
            },
            {
                name: "command",
                description: "Reload File Command",
                type: "SUB_COMMAND"
            }
        ]
    }
})
export default class ReloadCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(true);
        try {
            await this.client.command.reloadAll(
                ctx.options?.getString("slash") ?? undefined
            );
            await ctx.send({
                embeds: [createEmbed("info", "**Reload Command Successful!**")]
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
