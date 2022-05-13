import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "mock",
    description: "Mocking case word or sentences",
    usage: "mock {ABRACKETSL}query{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "query",
                type: "STRING",
                description: "Text to mock",
                required: true
            }
        ]
    }
})
export default class MockingCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const after = this.mocker(ctx.options!.getString("query")!);
        const e = createEmbed("info", after)
            .setAuthor({
                name: "Mocking Case",
                iconURL: this.client.user!.displayAvatarURL({
                    dynamic: true,
                    size: 4096,
                    format: "png"
                })!
            })
            .setThumbnail(
                "https://cdn.discordapp.com/attachments/406593784697192468/503049110467641345/mock.png"
            );
        await ctx.send({ embeds: [e] });
    }

    private mocker(data: string): string {
        let res = "";
        const len = data.length;
        for (let i = 0; i < len; i++) {
            res += (i + 1) % 2 === 0 ? data[i].toUpperCase() : data[i];
        }
        return res;
    }
}
