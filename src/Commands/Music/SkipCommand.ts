import {
    isMusicPlaying, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "skip",
    description: "Skip the current player",
    usage: "skip [track number]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "range",
                type: "NUMBER",
                description: "Range of the track want to skip"
            }
        ]
    }
})
export default class SkipCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if (ctx.options!.getNumber("range")! > 0) {
            if (ctx.options!.getNumber("range")! > queue.tracks.length) {
                await ctx.send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `I am sorry, but ${queue.tracks.length ? `only ${queue.tracks.length} track(s) in the queue` : "Nothing track(s) in the queue"}**`
                        )
                    ]
                })
                    .then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined)
                    .catch(() => null);
                return undefined;
            }
            if (queue.queueRepeat) {
                for (let i = 0; i < ctx.options!.getNumber("range")! - 1; i++) {
                    queue.tracks.push(queue.tracks.shift()!);
                }
            } else {
                queue.tracks = queue.tracks.slice(ctx.options!.getNumber("range")! - 1);
            }
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", `You has been skipped [${ctx.options!.getNumber("range")! - 1}] track(s)`)] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
            queue.stopTrack();
        } else {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "You has been skipped currently playing")] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
            queue.stopTrack();
        }
    }
}
