import * as yaml from "js-yaml";

export interface YamlFormatOptions {
  indent?: 2 | 4;
}

export interface YamlFormatResult {
  output: string;
  error?: string;
}

export function formatYaml(input: string, options?: YamlFormatOptions): YamlFormatResult {
  const indent = options?.indent ?? 2;
  try {
    const docs: unknown[] = [];
    yaml.loadAll(input, (doc: unknown) => docs.push(doc));

    if (docs.length === 0) return { output: "" };

    if (docs.length === 1) {
      return { output: yaml.dump(docs[0], { indent }) };
    }

    // Multi-document: re-serialize each with --- separator
    const output = docs.map((doc) => yaml.dump(doc, { indent })).join("---\n");
    return { output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: "", error: message };
  }
}
