import {
    ZuikakuDecorator,
    isMusicPlaying,
    isSameVoiceChannel,
    isUserInTheVoiceChannel
} from "#zuikaku/Handlers/Decorator";
import { CommandContext } from "#zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "#zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "#zuikaku/types";
import { createEmbed } from "#zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "vaporwave",
    description: "Apply the vaporwave filter to player",
    usage: "{CATEGORY} vaporwave",
    clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class VaporwaveCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (dispatcher.filter.has("vaporwave")) {
            dispatcher.filter.setVaporwave(false);
        } else {
            dispatcher.filter.setVaporwave();
        }
        await ctx
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        `**Vaporwave filter has been ${
                            dispatcher.filter.has("vaporwave")
                                ? "activated"
                                : "deactivated"
                        }**`
                    )
                ]
            })
            .then(x => {
                if (fromGuildPlayer) {
                    setTimeout(() => x.delete().catch(() => null), 5000);
                }
            });
    }
}
