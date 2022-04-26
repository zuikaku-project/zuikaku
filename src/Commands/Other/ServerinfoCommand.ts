import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed, Utils } from "@zuikaku/Utils";
import dayjs, { locale } from "dayjs";
locale();

@ZuikakuDecorator<ICommandComponent>({
    name: "serverinfo",
    category: "general",
    description: "Get server information",
    usage: "serverinfo",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {}
})
export default class ServerinfoCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const sver = await Utils.firstUppercase(ctx.guild!.verificationLevel);
        const sbos = ctx.guild?.premiumSubscriptionCount;
        const scr = dayjs(ctx.guild?.createdAt).format("MMM D YYYY");
        const fetchOwner = await ctx.guild!.fetchOwner();
        const e = createEmbed("info")
            .setAuthor({ name: ctx.guild!.name })
            .addFields([
                {
                    name: "Owner",
                    value: `${fetchOwner.toString()} - ${fetchOwner.user.tag}`
                },
                { name: "Created", value: scr },
                { name: "Ver. Level", value: sver },
                {
                    name: "Boost Level",
                    value: sbos || !sbos ? "Not Boosted" : `Level ${sbos}`
                }
            ])
            .setThumbnail(
                ctx.guild!.iconURL({
                    dynamic: true,
                    size: 4096,
                    format: "png"
                })!
            )
            .setFooter({ text: `Id: ${ctx.guild!.id}` });
        await ctx.send({ embeds: [e] });
    }
}
