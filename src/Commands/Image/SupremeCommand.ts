import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "supreme",
    description: "Generate supreme image",
    usage: "{CATEGORY} supreme {ABRACKETSL}query{ABRACKETSR} [type]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Query input",
                required: true
            },
            {
                name: "type",
                type: "STRING",
                description: "Supreme type",
                required: false,
                choices: [
                    {
                        name: "Dark",
                        value: "Dark"
                    },
                    {
                        name: "Light",
                        value: "Light"
                    }
                ]
            }
        ]
    }
})
export default class SupremeCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        if (ctx.options!.getString("query")!.length > 15) {
            await ctx
                .send({
                    embeds: [
                        createEmbed("error", "maximum length of text is 15")
                    ]
                })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
            return undefined;
        }
        const img = await this.client.apis.canvas.requestImageAPI("supreme", {
            query: ctx.options!.getString("query")!,
            dark: ctx.options?.getString("type") === "Dark"
        });
        const ath = new MessageAttachment(img!, "supreme.png");
        await ctx.send({ files: [ath] });
    }
}
