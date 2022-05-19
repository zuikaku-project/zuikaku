import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuListener } from "#zuikaku/Structures/ZuikakuListener";
import { ICommandComponent, IListenerComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { WebhookClient } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<IListenerComponent>({
    name: "ZuikakuErrorEvent",
    event: "zuikakuError",
    emitter: "client"
})
export default class ZuikakuErrorEvent extends ZuikakuListener {
    public async execute(
        ctx: CommandContext,
        error: Error,
        command?: ICommandComponent
    ): Promise<void> {
        await ctx
            .send({
                embeds: [
                    createEmbed("info", error.message).setAuthor({
                        name: "OOF! An error has occured! Click her to join support server",
                        url: "https://zui.my.id/support"
                    })
                ],
                deleteButton: {
                    reference: ctx.author.id
                }
            })
            .catch(() => null);
        const embedLog = createEmbed("error").setTitle(
            `OOF! An error has occurred! ${
                command ? `| ${command.meta.name} command` : ""
            } `
        );
        if ((error.stack ?? error.message).length > 4050) {
            const { key } = await petitio(
                "https://hastebin.orchitiadi.repl.co/documents",
                "POST"
            )
                .body(error.stack ?? error.message)
                .json();
            embedLog.setDescription(
                `**StackTrack**\nhttps://hastebin.orchitiadi.repl.co/${
                    key as string
                }`
            );
        } else {
            embedLog.setDescription(
                `**StackTrack**\n\`\`\`bash\n${
                    error.stack ?? error.message
                }\n\`\`\``
            );
        }
        const webhook = new WebhookClient({
            url: "https://discord.com/api/webhooks/875557647401762918/2TRNR30WOfcFy7kpeSajcvx_tvhHsGoiTkOFOf-c4B8HqhgyAjGhCzuKs1Oy3OnnGm3z"
        });
        await webhook.send({ embeds: [embedLog] }).catch(() => null);
    }
}
