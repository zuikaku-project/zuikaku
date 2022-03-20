import {
    isMusicPlaying, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "shuffle",
    description: "Shuffle the track",
    usage: "{CATEGORY} shuffle",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND"
    }
})
export default class ShuffleCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.entity.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        queue.shuffleTrack();
        await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "You has been shuffled track(s)")] })
            .then(x => {
                if (fromGuildPlayer) {
                    setTimeout(() => x.delete().catch(() => null), 5000);
                }
            })
            .catch(() => null);
    }
}
