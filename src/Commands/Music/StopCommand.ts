import {
    isMusicPlaying,
    isSameVoiceChannel,
    isUserInTheVoiceChannel,
    ZuikakuDecorator
} from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createMusicEmbed } from "#zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "stop",
    description: "Stop the player",
    usage: "{CATEGORY} stop",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class StopCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        await dispatcher.destroyPlayer();
        await ctx
            .send({
                embeds: [
                    createMusicEmbed(
                        ctx,
                        "info",
                        "You has been stopped Music Player"
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
