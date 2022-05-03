/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import { IRouterComponent } from "@zuikaku/types";
import { Request, Response } from "express";

export class ZuikakuRouter implements IRouterComponent {
    public constructor(
        public client: ZuikakuClient,
        public readonly meta: IRouterComponent["meta"]
    ) {}

    public execute(req: Request, res: Response): any {}
}
