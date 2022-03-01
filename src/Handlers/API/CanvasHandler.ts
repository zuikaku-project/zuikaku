import { decodeBase64String } from "@zuikaku/types/core";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import petitio from "petitio";

export class CanvasHandler {
    public readonly baseURL = "https://api.maakoo.my.id/api/";
    public readonly endpoint = {
        brightness: "image/brightness",
        chip: "image/chip",
        circle: "image/circle",
        communist: "image/communist",
        contrast: "image/contrast",
        darkness: "image/darkness",
        gay: "image/gay",
        greyscale: "image/greyscale",
        instagram: "image/instagram",
        invert: "image/invert",
        sepia: "image/sepia",
        spotify: "image/spotify",
        supreme: "image/supreme",
        threshold: "image/threshold",
        what: "image/what",
        kleesay: "image/kleesay"
    };

    public constructor(public client: ZuikakuClient) { }

    public async requestImageAPI(getEndpoint: keyof APIEndpoint, data: decodeBase64String): Promise<Buffer | undefined> {
        try {
            const getAPIData = await petitio(this.baseURL)
                .path(this.endpoint[getEndpoint])
                .query("base64", this.client.utils.encodeDecodeBase64String(encodeURIComponent(JSON.stringify(data))))
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
    brightness: "image/brightness";
    chip: "image/chip";
    circle: "image/circle";
    communist: "image/communist";
    contrast: "image/contrast";
    darkness: "image/darkness";
    gay: "image/gay";
    greyscale: "image/greyscale";
    instagram: "image/instagram";
    invert: "image/invert";
    sepia: "image/sepia";
    spotify: "image/spotify";
    supreme: "image/supreme";
    threshold: "image/threshold";
    what: "image/what";
    kleesay: "image/kleesay";
}
