/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ZuikakuClient } from "#zuikaku/Structures/ZuikakuClient";
import { IListenerComponent } from "#zuikaku/types";

export class ZuikakuListener implements IListenerComponent {
    public constructor(
        public client: ZuikakuClient,
        public readonly meta: IListenerComponent["meta"]
    ) {}

    public execute(...args: any): any {}
}
