import * as yaml from "js-yaml";

export interface JsonToYamlResult {
  output: string;
  error?: string;
}

export function jsonToYaml(input: string): JsonToYamlResult {
  try {
    const parsed = JSON.parse(input);
    const output = yaml.dump(parsed);
    return { output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: "", error: message };
  }
}
