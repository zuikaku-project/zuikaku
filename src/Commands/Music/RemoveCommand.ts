import {
    isMusicPlaying, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "remove",
    description: "Remove song from player",
    usage: "{CATEGORY} remove {ABRACKETSL}number{ABRACKETSR} [range]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "number",
                type: "NUMBER",
                description: "Number of song in the queue",
                required: true
            },
            {
                name: "range",
                type: "NUMBER",
                description: "Number of song in the queue"
            }
        ]
    }
})
export default class RemoveCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.entity.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        const data = ctx.options!.getNumber("number")!;
        const data2 = ctx.options!.getNumber("range");
        const embed2 = createMusicEmbed(ctx, "info", `I am sorry, but ${queue.tracks.length ? `only ${queue.tracks.length} track(s) in the queue` : "Nothing track(s) in the queue"}**`);
        if (data < 1) return;
        if (data > queue.tracks.length) {
            await ctx.send({ embeds: [embed2] })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
            return undefined;
        }
        if (data2) {
            if (data > data2) return;
            if (data2 > queue.tracks.length) {
                await ctx.send({ embeds: [embed2] })
                    .then(x => {
                        if (fromGuildPlayer) {
                            setTimeout(() => x.delete().catch(() => null), 5000);
                        }
                    })
                    .catch(() => null);
                return undefined;
            }
            const calculate = data2 - data;
            await queue.removeTrack(data - 1, calculate + 1);
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", `You has been removed [\`${calculate + 1}\`] track(s) from queue**`)
                ]
            })
                .then(x => {
                    if (fromGuildPlayer) {
                        setTimeout(() => x.delete().catch(() => null), 5000);
                    }
                })
                .catch(() => null);
        } else {
            const get = await queue.removeTrack(data - 1, data2!);
            await ctx.send({
                embeds: [
                    createMusicEmbed(ctx, "info", `You has been removed [${data}]・${get[0].info.title!} track from queue**`)
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
