import { ZuikakuInhibitor } from "./ZuikakuInhibitor";

export function isMusicPlaying(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (!queue) {
            return "**<a:decline:879311910045097984> | Operation Canceled. Nothing are playing now**";
        }
    });
}

export function isUserInTheVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        if (!ctx.member?.voice.channel?.id) {
            return "**<a:decline:879311910045097984> | Operation Canceled. You need to join voice channel to using this command**";
        }
    });
}

export function isSameVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (!ctx.guild?.me?.voice.channel?.id) return undefined;
        if (ctx.member?.voice.channel?.id !== queue?.voiceId) {
            return "**<a:decline:879311910045097984> | Operation Canceled. You must in same voice channel with me**";
        }
    });
}

export function isSameTextChannel(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (queue && ctx.channel?.id !== queue.textId) {
            return `**This command only can be use in channel \`${ctx.guild?.channels.cache.get(queue.textId!)?.name ?? ""}\`**`;
        }
    });
}

export function isValidVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        if (!ctx.member?.voice.channel?.joinable) {
            return "**<a:decline:879311910045097984> | Operation Canceled. Make sure I have permission to connect your voice channel**";
        }
        if (
            ctx.member.voice.channel.type === "GUILD_STAGE_VOICE"
                ? !ctx.member.voice.channel.manageable
                : !ctx.member.voice.channel.speakable
        ) {
            return "**<a:decline:879311910045097984> | Operation Canceled. Make sure I have permission to speak in this voice channel**";
        }
    });
}

export function isQueueReachLimit(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (queue && queue.tracks.length > 250) {
            return "**Sorry, Total tracks has reached the limit**";
        }
    });
}

export function isNoNodesAvailable(): any {
    return ZuikakuInhibitor(ctx => {
        if (!Array.from(ctx.client.shoukaku.nodes).length) {
            ctx.client.shoukaku.getRandomNode();
            return "**All nodes not yet connected. Try again later.**";
        }
    });
}
