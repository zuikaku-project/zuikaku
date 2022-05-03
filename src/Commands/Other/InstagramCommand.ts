import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { CommandContext } from "@zuikaku/Structures/CommandContext";
import { ZuikakuCommand } from "@zuikaku/Structures/ZuikakuCommand";
import { ICommandComponent, IInstagram } from "@zuikaku/types";
import { createEmbed } from "@zuikaku/Utils";
import { MessageActionRow, MessageAttachment, MessageButton } from "discord.js";
import petitio from "petitio";

@ZuikakuDecorator<ICommandComponent>({
    name: "instagram",
    description: "Get instagram user",
    usage: "instagram {ABRACKETSL}user{ABRACKETSR} [nocanvas|dark]",
    clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
    slash: {
        options: [
            {
                name: "user",
                type: "STRING",
                description: "Fetch Instagram user profile",
                required: true
            },
            {
                name: "nocanvas",
                type: "BOOLEAN",
                description: "Send the message w/o canvas"
            },
            {
                name: "dark",
                type: "BOOLEAN",
                description: "Dark background"
            }
        ]
    }
})
export default class InstagramCommand extends ZuikakuCommand {
    public async execute(ctx: CommandContext): Promise<void> {
        if (ctx.isInteraction() && !ctx.deferred) await ctx.deferReply();
        try {
            const Account = await this.requestData(
                ctx.options!.getString("user")!
            ).catch(() => null);
            if (!Account) {
                await ctx
                    .send({
                        embeds: [
                            createEmbed(
                                "error",
                                "**<a:decline:879311910045097984> | Operation Canceled. " +
                                    "Cannot find that username or the service unavailable**"
                            )
                        ]
                    })
                    .then(x =>
                        setTimeout(() => x.delete().catch(() => null), 10000)
                    );
                return undefined;
            }
            const {
                fullName,
                userIg,
                bio,
                post,
                follower,
                following,
                isPrivate,
                profilePic,
                isVerified
            } = Account;
            const row = new MessageActionRow().addComponents([
                new MessageButton()
                    .setLabel("Follow Now!")
                    .setURL(
                        `https://www.instagram.com/${ctx.options!.getString(
                            "user"
                        )!}`
                    )
                    .setStyle("LINK")
                    .setEmoji("<:instagram:857163896123818025>")
            ]);
            const e = createEmbed("info")
                .setTitle(fullName)
                .setThumbnail(`${profilePic}`)
                .addField(
                    "Account Information",
                    "**```asciidoc\n" +
                        `• Username  :: ${userIg}\n` +
                        `• Fullname  :: ${fullName}\n` +
                        `• Biography :: ${bio}\n` +
                        `• Followers :: ${follower}\n` +
                        `• Following :: ${following}\n` +
                        `• Private   :: ${isPrivate ? "Yes 🔒" : "No 🔓"}\n` +
                        "```**"
                );
            if (ctx.options?.getBoolean("nocanvas")) {
                await ctx.send({
                    embeds: [e],
                    components: [row],
                    deleteButton: {
                        reference: ctx.author.id
                    }
                });
                return undefined;
            }
            const img = await this.client.apis.canvas.requestImageAPI(
                "instagram",
                {
                    fullName,
                    userIg,
                    post,
                    follower,
                    following,
                    isPrivate,
                    isVerified,
                    dark: ctx.options!.getBoolean("dark")!,
                    bio,
                    profilePic
                }
            );
            const ath = new MessageAttachment(img!, "instagram.png");
            await ctx.send({
                files: [ath],
                components: [row],
                deleteButton: {
                    reference: ctx.author.id
                }
            });
        } catch {
            ctx.send({
                embeds: [
                    createEmbed(
                        "error",
                        "**<a:decline:879311910045097984> | Operation Canceled. Cannot find that username or the service unavailable**"
                    )
                ]
            })
                .then(x =>
                    setTimeout(() => x.delete().catch(() => null), 10000)
                )
                .catch(() => null);
        }
    }

    private async requestData(username: string): Promise<AccountStructure> {
        const Account: AccountStructure = {
            fullName: "",
            userIg: "",
            bio: "",
            post: 0,
            follower: 0,
            following: 0,
            isPrivate: false,
            profilePic: "",
            isVerified: false
        };
        let results: IInstagram | undefined;
        try {
            results = await petitio(
                `https://www.instagram.com/${username}/?__a=1`
            )
                .header(
                    "Cookie",
                    `sessionid=${this.client.config.apiKey.cookie.instagram}`
                )
                .json();
        } catch {
            results = await petitio(
                `https://www.instagram.com/${username}/feed/?__a=1`
            ).json();
        }
        Account.fullName = results!.graphql!.user.full_name;
        Account.userIg = results!.graphql!.user.username;
        Account.bio = results!.graphql!.user.biography ?? "";
        Account.post =
            results!.graphql!.user.edge_owner_to_timeline_media.count;
        Account.follower = results!.graphql!.user.edge_followed_by.count;
        Account.following = results!.graphql!.user.edge_follow.count;
        Account.isPrivate = results!.graphql!.user.is_private;
        Account.profilePic = results!.graphql!.user.profile_pic_url_hd;
        Account.isVerified = results!.graphql!.user.is_verified;
        return Account;
    }
}

interface AccountStructure {
    fullName: string;
    userIg: string;
    bio: string;
    post: number;
    follower: number;
    following: number;
    isPrivate: boolean;
    profilePic: string;
    isVerified: boolean;
}
