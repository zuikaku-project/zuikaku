import {
    isMusicPlaying,
    isSameVoiceChannel,
    isUserInTheVoiceChannel,
    ZuikakuDecorator
} from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "resume",
    description: "Resume the player",
    usage: "{CATEGORY} resume",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class ResumeCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (dispatcher.player.paused) {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "You can't resume player if the player is not paused"
                        )
                    ]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
        } else {
            await dispatcher.setPaused(false);
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "You has been resumed the player"
                        )
                    ]
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
