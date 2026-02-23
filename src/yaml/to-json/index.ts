import * as yaml from "js-yaml";

export interface YamlToJsonResult {
  output: string;
  error?: string;
}

export function yamlToJson(input: string): YamlToJsonResult {
  try {
    const parsed = yaml.load(input);
    // yaml.load returns undefined for an empty document; normalize to null for valid JSON output
    const value = parsed === undefined ? null : parsed;
    const output = JSON.stringify(value, null, 2);
    return { output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: "", error: message };
  }
}
