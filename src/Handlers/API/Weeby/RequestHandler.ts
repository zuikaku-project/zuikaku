import petitio from "petitio";

export const RequestHandler = async (option: { path: string; token: string }): Promise<any> => petitio(`https://weebyapi.xyz${option.path}`)
    .header({
        "User-Agent": "Zuikaku-ship",
        Authorization: `Bearer ${option.token}`
    }).json();
