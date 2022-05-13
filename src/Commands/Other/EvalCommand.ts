/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/restrict-template-expressions */
import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import petitio from "petitio";
import util from "util";

@ZuikakuDecorator<ICommandComponent>({
    name: "eval",
    description: "Run code snippets",
    usage: "eval {ABRACKETSL}code{ABRACKETSR} [async|silent]",
    clientPermissions: ["SEND_MESSAGES"],
    slash: {
        options: [
            {
                name: "code",
                type: "STRING",
                description: "Evaluated code",
                required: true
            },
            {
                name: "async",
                type: "BOOLEAN",
                description: "Asynchronous"
            },
            {
                name: "silent",
                type: "BOOLEAN",
                description: "Ephemeral Output"
            }
        ]
    },
    devOnly: true,
    contextChat: "Evaluated this"
})
export default class EvalCommand extends ZuikakuCommand {
    public toEval = "";

    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred)
            await ctx.deferReply(
                ctx.options?.getBoolean("silent") ??
                    ctx.options
                        ?.getMessage("message")
                        ?.content.includes("--silent") ??
                    false
            );
        try {
            if (
                ctx.options?.getBoolean("async") ||
                ctx.options?.getMessage("message")?.content.includes("--async")
            ) {
                this.toEval = `(async () => { ${
                    ctx.options.getString("code") ??
                    ctx.options.getMessage("message")!.content
                } })()`;
            } else {
                this.toEval = `${
                    ctx.options?.getString("code") ??
                    ctx.options?.getMessage("message")?.content ??
                    ""
                }`;
            }
            const outputcode = util.inspect(
                // eslint-disable-next-line no-eval
                await eval(
                    // eslint-disable-next-line
                    this.toEval.replace(/`​`​`​|--async|--silent/g, "").trim()
                ),
                { depth: 0 }
            );
            if (outputcode.length > 1024) {
                const { key } = await petitio(
                    "https://hastebin.orchitiadi.repl.co/documents",
                    "POST"
                )
                    .body(outputcode)
                    .json();
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                await ctx.send({
                    content: `**Output**\nhttps://hastebin.orchitiadi.repl.co/${key}.js`,
                    deleteButton: { reference: ctx.author.id }
                });
            } else {
                await ctx.send({
                    content:
                        "**Output**\n" +
                        "```js\n" +
                        `${this.clean(outputcode)}` +
                        "\n```",
                    deleteButton: {
                        reference: ctx.author.id
                    }
                });
            }
        } catch (error: any) {
            if (error.length > 1024) {
                const { key } = await petitio(
                    "https://hastebin.orchitiadi.repl.co/documents",
                    "POST"
                )
                    .body(error)
                    .json();
                await ctx.send({
                    content: `**Error**\nhttps://hastebin.orchitiadi.repl.co/${key}.js`,
                    deleteButton: { reference: ctx.author.id }
                });
            } else {
                await ctx.send({
                    content: `**Error**\n \`\`\`js\n + ${error.stack} \n\`\`\``,
                    deleteButton: {
                        reference: ctx.author.id
                    }
                });
            }
        }
    }

    private replace(text: string): string {
        const regex = new RegExp(
            `${this.client.token}|${this.client.config.api.dbl}|${this.client.config.api.spotify.clientId}|${this.client.config.api.spotify.clientSecret}|${this.client.config.api.cookie.instagram}`,
            "gi"
        );
        return text.replace(regex, " [REDACTED] ");
    }

    private clean(text: string): string {
        if (typeof text === "string") {
            return this.replace(
                text
                    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
                    .replace(/@/g, `@${String.fromCharCode(8203)}`)
            );
        }
        return this.replace(text);
    }
}
