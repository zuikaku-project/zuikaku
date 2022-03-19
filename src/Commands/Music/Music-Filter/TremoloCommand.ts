import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { isMusicPlaying, isSameVoiceChannel, isUserInTheVoiceChannel } from "@zuikaku/Handlers/Decorators/ZuikakuPlayerInhibitor";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "tremolo",
    description: "Apply the tremolo filter to player",
    usage: "{CATEGORY} tremolo",
    clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class TremoloCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.entity.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (queue.audioFilters.has("tremolo")) {
            queue.audioFilters.setTremolo(false);
        } else {
            queue.audioFilters.setTremolo();
        }
        await ctx.send({ embeds: [createEmbed("info", `**Tremolo filter has been ${queue.audioFilters.has("tremolo") ? "activated" : "deactivated"}**`)] }).then(x => {
            if (fromGuildPlayer) {
                setTimeout(() => x.delete().catch(() => null), 5000);
            }
        });
    }
}
