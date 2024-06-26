import { ZuikakuDecorator } from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed, Utils } from "#zuikaku/Utils";
import dayjs from "dayjs";

const { locale } = dayjs;
locale();

@ZuikakuDecorator<ICommandComponent>({
    name: "userinfo",
    description: "Get user informations",
    usage: "userinfo [query]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "user",
                type: "USER",
                description: "Display some user"
            }
        ]
    }
})
export default class UserinfoCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const member = Utils.parseMember(
            ctx,
            ctx.options?.getUser("user")?.id ?? ctx.author.id
        );
        const date = dayjs(member.user.createdAt).format("MMM D YYYY");
        const Jdate = dayjs(member.joinedAt).format("MMM D YYYY");
        const e = createEmbed("info")
            .setThumbnail(
                member.user.displayAvatarURL({
                    dynamic: true,
                    size: 4096,
                    format: "png"
                })!
            )
            .setAuthor({ name: member.user.tag })
            .addFields([
                { name: "Created", value: date },
                { name: "Joined Server", value: Jdate }
            ])
            .setFooter({ text: `UserID: ${member.user.id}` });
        await ctx.send({ embeds: [e] });
    }
}
