import {
    isMusicPlaying, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "resume",
    description: "Resume the current player",
    usage: "resume",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class ResumeCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (queue.player.paused) {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "You can't resume player if the player is not paused")] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
        } else {
            await queue.setPaused(false);
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "You has been resumed the player")] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
        }
    }
}
