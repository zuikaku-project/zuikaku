import { ZuikakuDecorator } from "@zuikaku/Handlers";
import { ZuikakuRouter } from "@zuikaku/Structures/ZuikakuRouter";
import { IRouterComponent } from "@zuikaku/types";
import { Request, Response } from "express";

@ZuikakuDecorator<IRouterComponent>({
    name: "basePage",
    method: "get",
    path: "/"
})
export default class BasePage extends ZuikakuRouter {
    public execute(req: Request, res: Response): void {
        res.status(200).send({
            message: "OK!",
            status: 200
        });
    }
}
