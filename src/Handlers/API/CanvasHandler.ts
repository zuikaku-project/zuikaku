import { decodeBase64String } from "@zuikaku/types/core";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import petitio from "petitio";

export class CanvasHandler {
    public readonly baseURL = "https://imageapi.orchitiadi.repl.co/";
    public readonly endpoint = {
        brightness: "api/image/brightness",
        chip: "api/image/chip",
        circle: "api/image/circle",
        communist: "api/image/communist",
        contrast: "api/image/contrast",
        darkness: "api/image/darkness",
        gay: "api/image/gay",
        greyscale: "api/image/greyscale",
        instagram: "api/image/instagram",
        invert: "api/image/invert",
        sepia: "api/image/sepia",
        spotify: "api/image/spotify",
        supreme: "api/image/supreme",
        threshold: "api/image/threshold",
        what: "api/image/what",
        kleesay: "api/image/kleesay"
    };

    public constructor(public client: ZuikakuClient) { }

    public async requestImageAPI(getEndpoint: keyof APIEndpoint, data: decodeBase64String): Promise<Buffer | undefined> {
        try {
            const getAPIData = await petitio(this.baseURL)
                .path(this.endpoint[getEndpoint])
                .query("base64", this.client.utils.encodeDecodeBase64String(JSON.stringify(data)))
                .header("Authorization", this.client.utils.encodeDecodeBase64String("243728573624614912.791271223077109820"))
                .send();
            if (getAPIData.statusCode !== 200) {
                return undefined;
            }
            return getAPIData.body;
        } catch {
            return undefined;
        }
    }
}

interface APIEndpoint {
    brightness: "api/image/brightness";
    chip: "api/image/chip";
    circle: "api/image/circle";
    communist: "api/image/communist";
    contrast: "api/image/contrast";
    darkness: "api/image/darkness";
    gay: "api/image/gay";
    greyscale: "api/image/greyscale";
    instagram: "api/image/instagram";
    invert: "api/image/invert";
    sepia: "api/image/sepia";
    spotify: "api/image/spotify";
    supreme: "api/image/supreme";
    threshold: "api/image/threshold";
    what: "api/image/what";
    kleesay: "api/image/kleesay";
}
