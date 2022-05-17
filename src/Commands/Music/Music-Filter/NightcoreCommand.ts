import { ZuikakuDecorator } from "@zuikaku/Handlers/Decorator";
import {
    isMusicPlaying,
    isSameVoiceChannel,
    isUserInTheVoiceChannel
} from "@zuikaku/Handlers/Decorator/ZuikakuPlayerInhibitor";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "nightcore",
    description: "Apply the nightcore filter to player",
    usage: "{CATEGORY} nightcore",
    clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class NightcoreCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (dispatcher.filter.has("nightcore")) {
            dispatcher.filter.setNightcore(false);
        } else {
            dispatcher.filter.setNightcore();
        }
        await ctx
            .send({
                embeds: [
                    createEmbed(
                        "info",
                        `**Nightcore filter has been ${
                            dispatcher.filter.has("nightcore")
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
