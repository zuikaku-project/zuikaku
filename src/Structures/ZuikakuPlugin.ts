/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { PluginManager } from "@zuikaku/Handlers/ShoukakuExtension/Plugin";
import { IPluginComponent } from "@zuikaku/types";

export class ZuikakuPlugin implements IPluginComponent {
    public constructor(public plugin: PluginManager, public meta: IPluginComponent["meta"]) { }
    public fetch(trackId: string, ...args: any): any { }
}
