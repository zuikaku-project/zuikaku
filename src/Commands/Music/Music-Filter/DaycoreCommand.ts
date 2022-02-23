import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { isMusicPlaying, isSameVoiceChannel, isUserInTheVoiceChannel } from "@zuikaku/Handlers/Decorators/ZuikakuPlayerInhibitor";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "daycore",
    description: "Apply the daycore filter to player",
    usage: "daycore",
    clientPermissions: ["SEND_MESSAGES", "ADD_REACTIONS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class DaycoreCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (queue.audioFilters.has("daycore")) {
            queue.audioFilters.setDaycore(false);
        } else {
            queue.audioFilters.setDaycore();
        }
        await ctx.send({ embeds: [createEmbed("info", `**Daycore filter has been ${queue.audioFilters.has("daycore") ? "activated" : "deactivated"}**`)] }).then(x => {
            if (fromGuildPlayer) {
                setTimeout(() => x.delete().catch(() => null), 5000);
            }
        });
    }
}