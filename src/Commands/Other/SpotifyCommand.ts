import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { GuildMember, MessageActionRow, MessageAttachment, MessageButton } from "discord.js";

@ZuikakuDecorator<ICommandComponent>({
    name: "spotify",
    description: "Display user spotify presence",
    usage: "spotify [user] [canvas|notime]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
    slash: {
        options: [
            {
                name: "user",
                type: "USER",
                description: "Fetch currently listening spotify user"
            },
            {
                name: "nocanvas",
                type: "BOOLEAN",
                description: "Send the message w/o canvas"
            },
            {
                name: "notime",
                type: "BOOLEAN",
                description: "Send the message canvas w/o time"
            }
        ]
    }
})
export default class SpotifyCommand extends ZuikakuCommand {
    public async execute(context: CommandContext): Promise<void> {
        if (context.isInteraction() && !context.deferred) await context.deferReply();
        const member = this.client.utils.parseMember(
            context,
            context.options?.getMember("user")
                ? (context.options.getMember("user") as GuildMember).id
                : ""
        );
        const getSpotifyActivity = this.getSpotifyPresence(member);
        if (!getSpotifyActivity) {
            await context.send({
                embeds: [
                    createEmbed("error", "**<a:decline:879311910045097984> | Operation Canceled. Cannot find spotify presence**")
                ]
            }).then(x => setTimeout(() => x.delete().catch(() => null), 10000)).catch(() => null);
            return undefined;
        }

        const duration = getSpotifyActivity.end - getSpotifyActivity.start;
        const progress = Date.now() - getSpotifyActivity.start;
        const progressstart = progress < 0 ? 0 : progress;
        const progressed = progressstart > duration ? duration : progressstart;
        const progressrun = this.client.utils.parseMs(progressed, { colonNotation: true }).colonNotation;
        const endprogress = this.client.utils.parseMs(duration, { colonNotation: true }).colonNotation;
        const nocanvasdata = createEmbed("info")
            .setAuthor({
                name: "Spotify Song Information",
                iconURL: this.client.user!.displayAvatarURL({ size: 4096, format: "png" })!,
                url: getSpotifyActivity.url
            })
            .addFields([
                { name: "Title", value: getSpotifyActivity.songName },
                { name: "Album", value: getSpotifyActivity.album },
                { name: "Artists", value: getSpotifyActivity.author },
                { name: "Duration", value: `[${progressrun}] - [${endprogress}]` }
            ])
            .setThumbnail(getSpotifyActivity.spotifyImage);
        const row = new MessageActionRow()
            .addComponents([
                new MessageButton()
                    .setLabel("Listen Now!")
                    .setURL(getSpotifyActivity.url)
                    .setStyle("LINK")
                    .setEmoji("<:SpotifyGreen:857159714159984650>")
            ]);
        if (context.options?.getBoolean("nocanvas")) {
            await context.send({
                embeds: [nocanvasdata],
                deleteButton: { reference: context.author.id },
                components: [row]
            });
            return undefined;
        }
        const getAPIImage = await this.client.apis.canvas.requestImageAPI(
            "spotify",
            {
                songName: getSpotifyActivity.songName,
                album: getSpotifyActivity.album,
                author: getSpotifyActivity.author,
                spotifyImage: getSpotifyActivity.spotifyImage,
                start: getSpotifyActivity.start,
                end: getSpotifyActivity.end
            }
        );
        await context.send({
            deleteButton: {
                reference: context.author.id
            },
            components: [row],
            files: [
                new MessageAttachment(getAPIImage!, "spotify.png")
            ]
        });
    }

    private getSpotifyPresence(guildMember: GuildMember): SpotifyActivity | undefined {
        const activity = guildMember.presence?.activities.find(x => x.name === "Spotify");
        if (!activity) return undefined;
        try {
            const SpotifyActivity = {
                songName: "",
                album: "",
                author: "",
                url: "",
                spotifyImage: "",
                start: 0,
                end: 0
            };
            SpotifyActivity.songName = activity.details!;
            SpotifyActivity.album = activity.assets!.largeText!;
            SpotifyActivity.author = activity.state!;
            SpotifyActivity.url = `https://open.spotify.com/track/${activity.syncId!}`;
            SpotifyActivity.spotifyImage = activity.assets!.largeImageURL({ format: "png", size: 4096 })!;
            SpotifyActivity.start = activity.timestamps!.start!.getTime();
            SpotifyActivity.end = activity.timestamps!.end!.getTime();
            return SpotifyActivity;
        } catch {
            return undefined;
        }
    }
}

interface SpotifyActivity {
    songName: string;
    album: string;
    author: string;
    url: string;
    spotifyImage: string;
    start: number;
    end: number;
}
