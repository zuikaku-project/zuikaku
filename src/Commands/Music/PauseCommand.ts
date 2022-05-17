import {
    isMusicPlaying,
    isSameTextChannel,
    isSameVoiceChannel,
    isUserInTheVoiceChannel,
    ZuikakuDecorator
} from "@zuikaku/Handlers/Decorator";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "pause",
    description: "Pause the player",
    usage: "{CATEGORY} pause",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class PauseCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (dispatcher.player.paused) {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "You can't paused player if the player is not playing"
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
            await dispatcher.setPaused(true);
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "You has been paused the player"
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
