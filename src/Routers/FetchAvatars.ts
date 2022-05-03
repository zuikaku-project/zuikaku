import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuRouter } from "@zuikaku/Structures/ZuikakuRouter";
import { IRouterComponent } from "@zuikaku/types";
import { Request, Response } from "express";

@ZuikakuDecorator<IRouterComponent>({
    name: "fetchAvatars",
    method: "get",
    path: "/fetchAvatars"
})
export default class FetchAvatars extends ZuikakuRouter {
    public async execute(req: Request, res: Response): Promise<void> {
        const baseGuild = await this.client.guilds
            .fetch("770540956163899423")
            .catch(() => null);
        if (!baseGuild) {
            res.status(500).send("Could not fetch base guild");
            return undefined;
        }
        const rolesSudo = baseGuild.members.cache
            .filter(
                member =>
                    [...member.roles.cache.keys()].includes(
                        "970570421898477589"
                    ) && !member.user.bot
            )
            .map(member => ({
                id: member.user.id,
                username: member.user.username,
                avatar: member.displayAvatarURL({
                    format: "png",
                    size: 4096,
                    dynamic: true
                })
            }));
        const zuikakuAvatar = [this.client.user!].map(user => ({
            id: user.id,
            username: user.username,
            avatar: user.displayAvatarURL({
                format: "png",
                size: 4096,
                dynamic: true
            })
        }));
        const avatars = [...rolesSudo, ...zuikakuAvatar];
        const categories = avatars.reduce<Record<string, IAvatars | undefined>>(
            (a, b) => {
                a[b.id] = b;
                return a;
            },
            {}
        );
        res.status(200).send(categories);
    }
}

interface IAvatars {
    id: string;
    username: string;
    avatar: string;
}
