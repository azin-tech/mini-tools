import * as yaml from "js-yaml";

export interface YamlValidateResult {
  valid: boolean;
  errors: string[];
}

export function validateYaml(input: string): YamlValidateResult {
  try {
    yaml.loadAll(input, () => {});
    return { valid: true, errors: [] };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, errors: [message] };
  }
}
