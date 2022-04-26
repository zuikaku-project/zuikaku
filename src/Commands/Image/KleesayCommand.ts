import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { MessageAttachment } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "kleesay",
    description: "Klee will say what you want",
    usage: "{CATEGORY} kleesay {ABRACKETSL}query{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Klee, please say:",
                required: true
            }
        ]
    }
})
export default class KleesayCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const img = await this.client.apis.canvas.requestImageAPI("kleesay", {
            query: ctx.options!.getString("query")!
        });
        const ath = new MessageAttachment(img!, "kleesay.png");
        await ctx.send({ files: [ath] });
    }
}
