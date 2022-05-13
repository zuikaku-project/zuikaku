import {
    isMusicPlaying,
    isSameVoiceChannel,
    isUserInTheVoiceChannel,
    ZuikakuDecorator
} from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "repeat",
    description: "Repeated track",
    usage: "{CATEGORY} repeat all|queue|disable",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND_GROUP",
        options: [
            {
                name: "all",
                type: "SUB_COMMAND",
                description: "Repeat all track in queue"
            },
            {
                name: "track",
                type: "SUB_COMMAND",
                description: "Repeat currently playing"
            },
            {
                name: "disable",
                type: "SUB_COMMAND",
                description: "Disable repeat"
            }
        ]
    }
})
export default class RepeatCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (ctx.options?.getSubcommand(false) === "all") {
            await dispatcher.setQueueRepeat();
            await ctx
                .send({
                    embeds: [createEmbed("info", "**🔁| Repeat mode: Queue**")]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
        } else if (ctx.options?.getSubcommand(false) === "track") {
            await dispatcher.setTrackRepeat();
            await ctx
                .send({
                    embeds: [createEmbed("info", "**🔂| Repeat mode: Track**")]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
        } else {
            await dispatcher.setTrackRepeat(false);
            await dispatcher.setQueueRepeat(false);
            await ctx
                .send({
                    embeds: [createEmbed("info", "**▶| Repeat mode: none**")]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
        }
    }
}
