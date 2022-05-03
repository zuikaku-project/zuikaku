import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuRouter } from "@zuikaku/Structures/ZuikakuRouter";
import { IChangelog, IRouterComponent } from "@zuikaku/types";
import { Utils } from "@zuikaku/Utils";
import { Request, Response } from "express";

@ZuikakuDecorator<IRouterComponent>({
    name: "changelogs",
    method: "get",
    path: "/changelogs"
})
export default class Changelogs extends ZuikakuRouter {
    public execute(req: Request, res: Response): void {
        const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec"
        ];
        const changelog = Utils.parseYaml<IChangelog[]>("Changelog.yaml");
        res.status(200).send(
            changelog.reverse().map(x => ({
                date: {
                    day: new Date(x.date).getDate(),
                    month: months[new Date(x.date).getMonth()],
                    year: `${new Date(x.date).getFullYear()}`.slice(2)
                },
                title: x.title,
                content: x.content.map((z, i) => `${i + 1}. ${z}`)
            }))
        );
    }
}
