import yaml from "js-yaml";
import { join } from "node:path";
import { readFileSync } from "node:fs";
export const parseYaml = (src: string): unknown => yaml.load(readFileSync(join(src), "utf8"));
