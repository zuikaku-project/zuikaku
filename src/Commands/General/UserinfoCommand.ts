import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import dayjs, { locale } from "dayjs";
locale();

@ZuikakuDecorator<ICommandComponent>({
    name: "userinfo",
    description: "Display user informations",
    usage: "userinfo [user|id]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "query",
                type: "USER",
                description: "Display some user"
            }
        ]
    }
})
export default class UserinfoCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = this.client.utils.parseMember(ctx, ctx.options?.getUser("user")?.id ?? ctx.author.id);
        const date = dayjs(member.user.createdAt).format("MMM D YYYY");
        const Jdate = dayjs(member.joinedAt).format("MMM D YYYY");
        const e = createEmbed("info")
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 4096, format: "png" })!)
            .setAuthor({ name: member.user.tag })
            .addFields([
                { name: "Created", value: date },
                { name: "Joined Server", value: Jdate }
            ])
            .setFooter({ text: `UserID: ${member.user.id}` });
        await ctx.send({ embeds: [e] });
    }
}
