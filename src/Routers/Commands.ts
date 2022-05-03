import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuRouter } from "@zuikaku/Structures/ZuikakuRouter";
import { IRouterComponent } from "@zuikaku/types";
import { Request, Response } from "express";

@ZuikakuDecorator<IRouterComponent>({
    name: "commands",
    method: "get",
    path: "/commands"
})
export default class Commands extends ZuikakuRouter {
    public execute(req: Request, res: Response): void {
        res.status(200).send(
            this.client.command
                .filter(x => Boolean(x.meta.slash))
                .map(x => ({
                    name: x.meta.name,
                    category: x.meta.category,
                    description: x.meta.description,
                    path: x.meta.path,
                    devOnly: x.meta.devOnly,
                    usage: x.meta.usage,
                    permissions: {
                        user: x.meta.userPermissions,
                        client: x.meta.clientPermissions
                    },
                    interactionOption: {
                        contextChat: x.meta.contextChat,
                        slash: x.meta.slash
                    }
                }))
        );
    }
}
