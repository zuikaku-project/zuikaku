/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { deserialize, serialize } from "v8";

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class Util {
    public static try<T>(fn: () => T): T | undefined {
        try {
            return fn();
        } catch {
            return undefined;
        }
    }

    public static async tryPromise<T>(fn: () => Promise<T>): Promise<T | undefined> {
        try {
            return await fn();
        } catch {
            return undefined;
        }
    }

    public static structuredClone<T>(obj: T): T {
        return deserialize(serialize(obj)) as T;
    }

    public static mergeDefault<T>(def: T, prov: T): T {
        const merged = { ...def, ...prov };
        const defKeys = Object.keys(def);
        for (const mergedKey of Object.keys(merged)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            if (!defKeys.includes(mergedKey)) delete (merged as any)[mergedKey];
        }
        return merged;
    }
}
