import {
    isMusicPlaying, isSameTextChannel, isSameVoiceChannel, isUserInTheVoiceChannel, ZuikakuDecorator
} from "@zuikaku/Handlers/Decorators";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createMusicEmbed } from "@zuikaku/Utils";

@ZuikakuDecorator<ICommandComponent>({
    name: "volume",
    description: "Change volume player",
    usage: "volume <number>",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    slash: {
        type: "SUB_COMMAND",
        options: [
            {
                name: "volume",
                type: "NUMBER",
                description: "Volume level",
                required: true
            }
        ]
    }
})
export default class VolumeCommand extends ZuikakuCommand {
    @isMusicPlaying()
    @isUserInTheVoiceChannel()
    @isSameVoiceChannel()
    @isSameTextChannel()
    public async execute(ctx: CommandContext): Promise<void> {
        const fromGuildPlayer = (await this.client.database.guilds.get(ctx.guild!.id))?.guildPlayer?.channelId === ctx.channel?.id;
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        const queue = this.client.shoukaku.queue.get(ctx.guild!.id)!;
        if ((/^(?:[1-9]?\d|100)$/).test(`${ctx.options!.getNumber("volume")!}`)) {
            queue.setVolume(ctx.options!.getNumber("volume")!);
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", `Player volume has been change to ${ctx.options!.getNumber("volume")!}`)] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
        } else {
            await ctx.send({ embeds: [createMusicEmbed(ctx, "info", "You not give me the valid number (1 - 100)")] }).then(x => fromGuildPlayer ? setTimeout(() => x.delete().catch(() => null), 5000) : undefined).catch(() => null);
        }
    }
}