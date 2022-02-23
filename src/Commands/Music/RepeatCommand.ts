import { isMusicPlaying, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator } from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "repeat",
    description: "Repeating the player",
    usage: "repeat [track|queue|off]",
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
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (ctx.options?.getSubcommand(false) === "all") {
            await queue.setQueueRepeat();
            await ctx.send({ embeds: [createEmbed("info", "**🔁| Repeat mode: Queue**")] }).then(message => fromGuildPlayer ? setTimeout(() => message.delete().catch(() => null), 5000) : undefined);
        } else if (ctx.options?.getSubcommand(false) === "track") {
            await queue.setTrackRepeat();
            await ctx.send({ embeds: [createEmbed("info", "**🔂| Repeat mode: Track**")] }).then(message => fromGuildPlayer ? setTimeout(() => message.delete().catch(() => null), 5000) : undefined);
        } else {
            await queue.setTrackRepeat(false);
            await queue.setQueueRepeat(false);
            await ctx.send({ embeds: [createEmbed("info", "**▶| Repeat mode: none**")] }).then(message => fromGuildPlayer ? setTimeout(() => message.delete().catch(() => null), 5000) : undefined);
        }
    }
}