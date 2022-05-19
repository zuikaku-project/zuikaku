import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";

@ZuikakuDecorator<ICommandComponent>({
    name: "say",
    description: "Make me say anything",
    usage: "say {ABRACKETSL}query{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Text to say",
                required: true
            }
        ]
    }
})
export default class SayCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        await ctx
            .send({ content: ctx.options!.getString("query")! })
            .catch(() => null);
    }
}
