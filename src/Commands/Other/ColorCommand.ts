/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/naming-convention */
import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageAttachment } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "color",
    description: "Get color information",
    usage: "color {ABRACKETSL}color{ABRACKETSR}",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "color",
                type: "STRING",
                description: "Query for search the color",
                required: true
            }
        ]
    }
})
export default class ColorCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const color = (/rgb\(\s*(?<r>\d{1,3})\s*,\s*(?<g>\d{1,3})\s*,\s*(?<b>\d{1,3})\s*\)$/).exec(ctx.options!.getString("color")!)
            ? this.rgbToHex(ctx.options!.getString("color")!)
            : ctx.options!.getString("color")!;
        try {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { hex, image, int, image_gradient, brightness, name, rgb } = await petitio(`https://api.alexflipnote.dev/colour/${color}`).json();
            const { body } = await petitio(image_gradient).send();
            const ath = new MessageAttachment(body, "color.png");
            const e = createEmbed()
                .setColor(hex)
                .setTitle(`${name as string} • ${hex as string}`)
                .setDescription(
                    "```asciidoc\n" +
                    `• colorName  :: ${name as string}\n` +
                    `• colorHex   :: ${hex as string}\n` +
                    `• colorRGB   :: ${rgb as string}\n` +
                    `• colorInt   :: ${int as number}\n` +
                    `• Brightness :: ${brightness as string}\n` +
                    "```"
                )
                .setImage("attachment://color.png")
                .setThumbnail(image as string);
            await ctx.send({
                embeds: [e],
                files: [ath]
            });
        } catch {
            await ctx.send({
                embeds: [
                    createEmbed("error", "**<a:decline:879311910045097984> | Operation Canceled. Not a valid hex value**")
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
        }
    }

    private rgbToHex(input: string): string {
        const split = input.split("(")[1].split(")")[0].trim().split(",");
        const map = split.map(x => {
            x = parseInt(x).toString(16);
            return x.length === 1 ? `0${x}` : x;
        });
        return `#${map.join("")}`;
    }
}
