/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ICommandComponent } from "@zuikaku/types/core";
import { CommandContext } from "./CommandContext";
import { ZuikakuClient } from "./ZuikakuClient";

export class ZuikakuCommand implements ICommandComponent {
    public constructor(
        public client: ZuikakuClient,
        public meta: ICommandComponent["meta"]
    ) {}

    public execute(ctx: CommandContext, ...any: any): any {}
}
