import { ZuikakuInhibitor } from "./ZuikakuInhibitor";

export function isMusicPlaying(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (!queue) {
            return "I am sorry but I am not playing anything right now.";
        }
    });
}

export function isUserInTheVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        if (!ctx.member?.voice.channel?.id) {
            return "I am sorry but you are not in a voice channel.";
        }
    });
}

export function isSameVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (!ctx.guild?.me?.voice.channel?.id) return undefined;
        if (ctx.member?.voice.channel?.id !== queue?.voiceId) {
            return "I am sorry but you are not in the same voice channel as me.";
        }
    });
}

export function isSameTextChannel(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (queue && ctx.channel?.id !== queue.textId) {
            return `I am sorry but this player can only be used in ${ctx.client.channels.cache.get(queue.textId ?? "")?.toString() ?? ""}`;
        }
    });
}

export function isValidVoiceChannel(): any {
    return ZuikakuInhibitor(ctx => {
        if (!ctx.member?.voice.channel?.joinable) {
            return "I am sorry but I cannot join your voice channel. Please make sure I have the permission to join your voice channel.";
        }
        if (
            ctx.member.voice.channel.type === "GUILD_STAGE_VOICE"
                ? !ctx.member.voice.channel.manageable
                : !ctx.member.voice.channel.speakable
        ) {
            return "I am sorry but I cannot speak in your voice channel. Please make sure I have the permission to speak in your voice channel.";
        }
    });
}

export function isQueueReachLimit(): any {
    return ZuikakuInhibitor(ctx => {
        const queue = ctx.client.shoukaku.queue.get(ctx.guild!.id);
        if (queue && queue.tracks.length > 250) {
            return "I am sorry but the queue is full (250 tracks).";
        }
    });
}

export function isNoNodesAvailable(): any {
    return ZuikakuInhibitor(ctx => {
        if (!Array.from(ctx.client.shoukaku.nodes).length) {
            return "I am sorry but I cannot play music because there are no nodes available.";
        }
    });
}
