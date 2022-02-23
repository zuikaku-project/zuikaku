import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { GuildMember, Util } from "discord.js";
import { readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import Pagination from "./Pagination";

export default class UtilHandler {
    public readonly pagination = Pagination;
    public constructor(public client: ZuikakuClient) { }

    public encodeDecodeBase64String(anyString: string, decode = false): string {
        if (decode) return Buffer.from(anyString, "base64").toString("ascii");
        return Buffer.from(anyString).toString("base64");
    }

    public getUserId(user: string): string {
        return (/(?<id>[\w\-.]+)/).exec(user)?.groups?.id ?? "";
    }

    public async import<T>(path: string, ...args: any[]): Promise<T | undefined> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const file = await import(resolve(path)).then(m => m.default);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        return file ? new file(...args) : undefined;
    }

    public readdirRecursive(directory: string): string[] {
        const results: string[] = [];
        function read(path: string): void {
            const files = readdirSync(path);
            for (const file of files) {
                const dir = join(path, file);
                if (statSync(dir).isDirectory()) {
                    read(dir);
                } else {
                    results.push(dir);
                }
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete require.cache[dir];
            }
        }
        read(directory);
        return results;
    }

    public firstUppercase(data: string): any {
        return data.toLowerCase().split(" ").map(x => x.charAt(0).toUpperCase() + x.substring(1))
            .join(" ");
    }

    public numberformat(num: number): string {
        const si = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        // eslint-disable-next-line prefer-named-capture-group
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        let i;
        for (i = si.length - 1; i > 0; i--) {
            if (num >= si[i].value) {
                break;
            }
        }
        return (num / si[i].value).toFixed(1).replace(rx, "$1") + si[i].symbol;
    }

    public parseMs(ms: number, options: { humanTime?: boolean; verbose?: boolean; colonNotation?: boolean } = { humanTime: false, verbose: false, colonNotation: false }): {
        colonNotation: string;
        humanTime: string;
        days: string;
        hours: string;
        minutes: string;
        seconds: string;
        milliseconds: string;
        microseconds: string;
        nanoseconds: string;
    } {
        const roundTowardsZero = ms > 0 ? Math.floor : Math.ceil;
        const arrayColonNotation = [];
        const getConvertedMS = {
            colonNotation: "",
            humanTime: "",
            days: "",
            hours: "",
            minutes: "",
            seconds: "",
            milliseconds: "",
            microseconds: "",
            nanoseconds: ""
        };
        getConvertedMS.days = Number(roundTowardsZero(ms / 86400000).toFixed(0)) < 10
            ? `0${Number(roundTowardsZero(ms / 86400000).toFixed(0))}`
            : `${Number(roundTowardsZero(ms / 86400000).toFixed(0))}`;
        getConvertedMS.hours = Number((roundTowardsZero(ms / 3600000) % 24).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms / 3600000) % 24).toFixed(0))}`
            : `${Number((roundTowardsZero(ms / 3600000) % 24).toFixed(0))}`;
        getConvertedMS.minutes = Number((roundTowardsZero(ms / 60000) % 60).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms / 60000) % 60).toFixed(0))}`
            : `${Number((roundTowardsZero(ms / 60000) % 60).toFixed(0))}`;
        getConvertedMS.seconds = Number((roundTowardsZero(ms / 1000) % 60).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms / 1000) % 60).toFixed(0))}`
            : `${Number((roundTowardsZero(ms / 1000) % 60).toFixed(0))}`;
        getConvertedMS.milliseconds = Number((roundTowardsZero(ms) % 1000).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms) % 1000).toFixed(0))}`
            : `${Number((roundTowardsZero(ms) % 1000).toFixed(0))}`;
        getConvertedMS.microseconds = Number((roundTowardsZero(ms * 1000) % 1000).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms * 1000) % 1000).toFixed(0))}`
            : `${Number((roundTowardsZero(ms * 1000) % 1000).toFixed(0))}`;
        getConvertedMS.nanoseconds = Number((roundTowardsZero(ms * 1e6) % 1000).toFixed(0)) < 10
            ? `0${Number((roundTowardsZero(ms * 1e6) % 1000).toFixed(0))}`
            : `${Number((roundTowardsZero(ms * 1e6) % 1000).toFixed(0))}`;
        if (options.colonNotation) {
            if (Number(getConvertedMS.days)) {
                arrayColonNotation.push(...[getConvertedMS.days, getConvertedMS.hours, getConvertedMS.minutes, getConvertedMS.seconds]);
                getConvertedMS.colonNotation = arrayColonNotation.join(":");
                return getConvertedMS;
            }
            if (Number(getConvertedMS.hours)) {
                arrayColonNotation.push(...[getConvertedMS.hours, getConvertedMS.minutes, getConvertedMS.seconds]);
                getConvertedMS.colonNotation = arrayColonNotation.join(":");
                return getConvertedMS;
            }
            if (Number(getConvertedMS.minutes)) {
                arrayColonNotation.push(...[getConvertedMS.minutes, getConvertedMS.seconds]);
                getConvertedMS.colonNotation = arrayColonNotation.join(":");
                return getConvertedMS;
            }
            if (Number(getConvertedMS.seconds)) {
                arrayColonNotation.push(getConvertedMS.seconds);
                getConvertedMS.colonNotation = `00:${arrayColonNotation.join("")}`;
                return getConvertedMS;
            }
        }
        let days = `${Number(getConvertedMS.days)}`;
        let hours = `${Number(getConvertedMS.hours)}`;
        let minutes = `${Number(getConvertedMS.minutes)}`;
        let seconds = `${Number(getConvertedMS.seconds)}`;
        let milliseconds = `${Number(getConvertedMS.milliseconds)}`;
        let microseconds = `${Number(getConvertedMS.microseconds)}`;
        let nanoseconds = `${Number(getConvertedMS.nanoseconds)}`;
        if (options.verbose) {
            if (Number(getConvertedMS.days)) days += "days";
            if (Number(getConvertedMS.hours)) hours += "hours";
            if (Number(getConvertedMS.minutes)) minutes += "minutes";
            if (Number(getConvertedMS.seconds)) seconds += "seconds";
            if (Number(getConvertedMS.milliseconds)) milliseconds += "milliseconds";
            if (Number(getConvertedMS.microseconds)) microseconds += "microseconds";
            if (Number(getConvertedMS.nanoseconds)) nanoseconds += "nanoseconds";
        } else {
            if (Number(getConvertedMS.days)) days += "d";
            if (Number(getConvertedMS.hours)) hours += "h";
            if (Number(getConvertedMS.minutes)) minutes += "m";
            if (Number(getConvertedMS.seconds)) seconds += "s";
            if (Number(getConvertedMS.milliseconds)) milliseconds += "ms";
            if (Number(getConvertedMS.microseconds)) microseconds += "µs";
            if (Number(getConvertedMS.nanoseconds)) nanoseconds += "ns";
        }
        if (options.humanTime) {
            const arrayHumanTime = [];
            if (Number(getConvertedMS.days)) {
                arrayHumanTime.push(...[days,
                    Number(getConvertedMS.hours)
                        ? hours
                        : "",
                    Number(getConvertedMS.minutes)
                        ? minutes
                        : "",
                    Number(getConvertedMS.seconds)
                        ? seconds
                        : ""]);
                getConvertedMS.humanTime = arrayHumanTime.join(" ").trim();
                return getConvertedMS;
            }
            if (Number(getConvertedMS.hours)) {
                arrayHumanTime.push(...[hours,
                    Number(getConvertedMS.minutes)
                        ? minutes
                        : "",
                    Number(getConvertedMS.seconds)
                        ? seconds
                        : ""]);
                getConvertedMS.humanTime = arrayHumanTime.join(" ").trim();
                return getConvertedMS;
            }
            if (Number(getConvertedMS.minutes)) {
                arrayHumanTime.push(...[minutes,
                    Number(getConvertedMS.seconds)
                        ? seconds
                        : ""]);
                getConvertedMS.humanTime = arrayHumanTime.join(" ").trim();
                return getConvertedMS;
            }
            if (Number(getConvertedMS.seconds)) {
                arrayHumanTime.push(...[seconds]);
                getConvertedMS.humanTime = arrayHumanTime.join(" ");
                return getConvertedMS;
            }
        }
        if (Number(getConvertedMS.days)) getConvertedMS.days = days;
        if (Number(getConvertedMS.hours)) getConvertedMS.hours = hours;
        if (Number(getConvertedMS.minutes)) getConvertedMS.minutes = minutes;
        if (Number(getConvertedMS.seconds)) getConvertedMS.seconds = seconds;
        if (Number(getConvertedMS.milliseconds)) getConvertedMS.milliseconds = milliseconds;
        if (Number(getConvertedMS.microseconds)) getConvertedMS.microseconds = microseconds;
        if (Number(getConvertedMS.nanoseconds)) getConvertedMS.nanoseconds = nanoseconds;
        return getConvertedMS;
    }

    public progressBar(total: number, current: number, size = 40, line = "▬", slider = "🔘"): string {
        let bar;
        if (current > total) {
            bar = line.repeat(size + 2);
        } else {
            const percentage = current / total;
            const progress = Math.round(size * percentage);
            const emptyProgress = size - progress;
            const progressText = line.repeat(progress).replace(/.$/, slider);
            const emptyProgressText = line.repeat(emptyProgress);
            bar = progressText + emptyProgressText;
        }
        return bar;
    }

    public parseMember(ctx: CommandContext, parse?: string | null): GuildMember {
        const content = parse?.trim().split(" ")[0];
        if (!content?.length) return ctx.member!;
        // eslint-disable-next-line prefer-named-capture-group
        return ctx.guild?.members.cache.get(content.replace(/(:?@|!)|(<|>)/g, "")) ??
            ctx.guild!.members.cache.filter(x => x.nickname === parse || x.user.username === parse).first()!;
    }

    public parseMsg(ctx: CommandContext, parse?: string): string {
        const content = parse?.trim().split(" ")[0];
        if (!content) return ctx.author.displayAvatarURL({ format: "png", size: 4096 });
        try {
            if (content.includes(this.client.options.http!.cdn!)) return content;
            if (Util.parseEmoji(content)?.id) {
                return `${this.client.options.http!.cdn!}/emojis/${Util.parseEmoji(content)!.id!}.${Util.parseEmoji(content)?.animated
                    ? "gif"
                    : "png?size=4096"}`;
            }
            // eslint-disable-next-line prefer-named-capture-group
            const guildMember = ctx.guild?.members.cache.get(content.replace(/(:?@|!)|(<|>)/g, "")) ??
                ctx.guild?.members.cache.filter(x => x.nickname === parse || x.user.username === parse).first();
            if (guildMember !== undefined) return guildMember.user.displayAvatarURL({ format: "png", size: 4096 });
            return ctx.author.displayAvatarURL({ format: "png", size: 4096 });
        } catch {
            return ctx.author.displayAvatarURL({ format: "png", size: 4096 });
        }
    }
}
