import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { User } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "avatar",
    description: "Display avatar user or guild",
    usage: "avatar [user|flags]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        options: [
            {
                name: "user",
                type: "SUB_COMMAND",
                description: "Display avatar user",
                options: [
                    {
                        name: "user",
                        type: "USER",
                        description: "User avatar to display"
                    }
                ]
            },
            {
                name: "server",
                type: "SUB_COMMAND",
                description: "Display server icon"
            }
        ]
    }
})
export default class AvatarCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        if (ctx.options?.getSubcommand(false) === "user") {
            this.userAvatar(ctx, ctx.options.getUser("user"));
        } else {
            this.guildIcon(ctx);
        }
    }

    private userAvatar(ctx: CommandContext, user: User | null): void {
        const member = this.client.utils.parseMember(ctx, user ? user.id : "");
        const avatarEmbed = createEmbed("info")
            .setAuthor({
                name: member.user.tag,
                iconURL: member.user.displayAvatarURL({ format: "png", dynamic: true, size: 4096 }),
                url: member.user.displayAvatarURL({ format: "png", dynamic: true, size: 4096 })
            })
            .setImage(member.user.displayAvatarURL({ format: "png", dynamic: true, size: 4096 }));
        void ctx.send({
            embeds: [
                avatarEmbed
            ],
            deleteButton: {
                reference: ctx.author.id
            }
        });
    }

    private guildIcon(ctx: CommandContext): void {
        const avatarEmbed = createEmbed("info")
            .setAuthor({
                name: ctx.guild!.name,
                iconURL: ctx.guild!.iconURL({ dynamic: true, size: 4096, format: "png" })!,
                url: ctx.guild!.iconURL({ dynamic: true, size: 4096, format: "png" })!
            })
            .setImage(ctx.guild!.iconURL({ format: "png", dynamic: true, size: 4096 })!);
        void ctx.send({
            embeds: [
                avatarEmbed
            ],
            deleteButton: {
                reference: ctx.author.id
            }
        });
    }
}
