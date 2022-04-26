import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { exec } from "node:child_process";

@ZuikakuDecorator<ICommandComponent>({
    name: "execute",
    description: "Run bash code",
    usage: "execute {ABRACKETSL}bash{ABRACKETSR}",
    clientPermissions: "SEND_MESSAGES",
    slash: {
        options: [
            {
                name: "bash",
                type: "STRING",
                description: "Bash code",
                required: true
            }
        ]
    },
    devOnly: true
})
export default class ExecCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply(true);
        exec(ctx.options!.getString("bash")!, async (e, stdout, stderr) => {
            if (e)
                return ctx.send({ content: `\`\`\`js\n${e.message}\n\`\`\`` });
            if (!stderr && !stdout)
                return ctx.send(
                    { content: "Success without results!" },
                    "followUp"
                );
            if (stdout) {
                const pages = this.pagination(stdout, 1950);
                for (const page of pages)
                    await ctx.send(
                        { content: `\`\`\`bash\n${page}\n\`\`\`` },
                        "followUp"
                    );
            }
            if (stderr) {
                const pages = this.pagination(stderr, 1950);
                for (const page of pages)
                    await ctx.send(
                        { content: `\`\`\`bash\n${page}\n\`\`\`` },
                        "followUp"
                    );
            }
        });
    }

    private pagination(text: string, limit: number): string[] {
        const lines = text.trim().split("\n");
        const pages = [];
        let chunk = "";
        for (const line of lines) {
            if (chunk.length + line.length > limit && chunk.length > 0) {
                pages.push(chunk);
                chunk = "";
            }
            if (line.length > limit) {
                const lineChunks = line.length / limit;
                for (let i = 0; i < lineChunks; i++) {
                    const start = i * limit;
                    const end = start + limit;
                    pages.push(line.slice(start, end));
                }
            } else {
                chunk += `${line}\n`;
            }
        }
        if (chunk.length > 0) pages.push(chunk);
        return pages;
    }
}
