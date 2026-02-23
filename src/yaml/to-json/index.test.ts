import { describe, expect, it } from "bun:test";
import { yamlToJson } from "./index";

describe("yamlToJson", () => {
  it("converts a YAML string to pretty-printed JSON", () => {
    const result = yamlToJson("key: value\nnum: 42");
    expect(result.error).toBeUndefined();
    const parsed = JSON.parse(result.output);
    expect(parsed.key).toBe("value");
    expect(parsed.num).toBe(42);
    // Verify pretty-printed with 2-space indent
    expect(result.output).toContain("\n  ");
  });

  it("returns an error for invalid YAML", () => {
    const result = yamlToJson("key: [unclosed");
    expect(result.output).toBe("");
    expect(result.error).toBeTruthy();
  });

  it("handles empty input by returning JSON null", () => {
    const result = yamlToJson("");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("null");
  });

  it("handles null input gracefully", () => {
    // A YAML document that is just the word 'null'
    const result = yamlToJson("null");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("null");
  });
});
