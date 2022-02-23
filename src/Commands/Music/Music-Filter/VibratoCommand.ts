import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { isMusicPlaying, isSameVoiceChannel, isUserInTheVoiceChannel } from "@zuikaku/Handlers/Decorators/ZuikakuPlayerInhibitor";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "vibrato",
    description: "Apply the vibrato filter to player",
    usage: "vibrato",
    clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class VibratoCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (queue.audioFilters.has("vibrato")) {
            queue.audioFilters.setVibrato(false);
        } else {
            queue.audioFilters.setVibrato();
        }
        await ctx.send({ embeds: [createEmbed("info", `**Vibrato filter has been ${queue.audioFilters.has("vibrato") ? "activated" : "deactivated"}**`)] }).then(x => {
            if (fromGuildPlayer) {
                setTimeout(() => x.delete().catch(() => null), 5000);
            }
        });
    }
}
