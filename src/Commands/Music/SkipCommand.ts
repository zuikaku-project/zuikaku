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
    name: "skip",
    description: "Skip the track",
    usage: "{CATEGORY} skip [range]",
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
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer =
            (await this.client.database.manager.guilds.get(ctx.guild!.id))
                ?.guildPlayer.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const dispatcher = this.client.shoukaku.dispatcher.get(ctx.guild!.id)!;
        if (ctx.options!.getNumber("range")! > 0) {
            if (
                ctx.options!.getNumber("range")! >
                dispatcher.queue.tracks.length
            ) {
                await ctx
                    .send({
                        embeds: [
                            createMusicEmbed(
                                ctx,
                                "info",
                                `I am sorry, but ${
                                    dispatcher.queue.tracks.length
                                        ? `only ${dispatcher.queue.tracks.length} track(s) in the queue`
                                        : "Nothing track(s) in the queue"
                                }**`
                            )
                        ]
                    })
                    .then(x => {
                        if (fromGuildPlayer) {
                            setTimeout(
                                () => x.delete().catch(() => null),
                                5000
                            );
                        }
                    })
                    .catch(() => null);
                return undefined;
            }
            if (dispatcher.queueRepeat) {
                for (let i = 0; i < ctx.options!.getNumber("range")! - 1; i++) {
                    dispatcher.queue.tracks.push(
                        dispatcher.queue.tracks.shift()!
                    );
                }
            } else {
                dispatcher.queue.tracks = dispatcher.queue.tracks.slice(
                    ctx.options!.getNumber("range")! - 1
                );
            }
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            `You has been skipped ${
                                ctx.options!.getNumber("range")! - 1
                            } track(s)`
                        )
                    ]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            dispatcher.stopTrack();
        } else {
            await ctx
                .send({
                    embeds: [
                        createMusicEmbed(
                            ctx,
                            "info",
                            "You has been skipped currently playing"
                        )
                    ]
                })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            dispatcher.stopTrack();
        }
    }
}
