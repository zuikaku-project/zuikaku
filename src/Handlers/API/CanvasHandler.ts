import { decodeBase64String } from "@zuikaku/types/core";
import { ZuikakuClient } from "@zuikaku/Structures/ZuikakuClient";
import petitio from "petitio";
import { Utils } from "@zuikaku/Utils";

export class CanvasHandler {
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

    private readonly baseURL: string;
    private readonly auth: string;

    public constructor(public client: ZuikakuClient) {
        this.baseURL = this.client.config.api.canvas.url;
        this.auth = this.client.config.api.canvas.auth;
    }

    public async requestImageAPI(
        getEndpoint: keyof APIEndpoint,
        data: decodeBase64String
    ): Promise<Buffer | undefined> {
        try {
            const getAPIData = await petitio(
                `http${this.client.config.api.canvas.secure ? "s" : ""}://${
                    this.baseURL
                }`
            )
                .path(this.endpoint[getEndpoint])
                .query(
                    "base64",
                    Utils.encodeDecodeBase64String(
                        encodeURIComponent(JSON.stringify(data))
                    )
                )
                .header("Authorization", this.auth)
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
