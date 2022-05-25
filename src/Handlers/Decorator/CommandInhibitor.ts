import { BaseInhibitor } from "./BaseInhibitor";

export function isValidAttachment(name: string, type: "audio" | "image"): any {
    return BaseInhibitor(ctx => {
        const getAttachment = ctx.options?.getAttachment(name);
        if (!getAttachment) return undefined;

        if (getAttachment.contentType?.split("/")[0] !== type) {
            return `I am sorry but you not attach ${type} file.`;
        }
    });
}
