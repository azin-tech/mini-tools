import { describe, expect, it } from "bun:test";
import { jsonToYaml } from "./index";

describe("jsonToYaml", () => {
  it("converts a flat JSON object to YAML", () => {
    const result = jsonToYaml('{"key":"value","num":42}');
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("key: value");
    expect(result.output).toContain("num: 42");
  });

  it("returns an error for invalid JSON", () => {
    const result = jsonToYaml("{invalid json}");
    expect(result.output).toBe("");
    expect(result.error).toBeTruthy();
  });

  it("handles nested objects", () => {
    const result = jsonToYaml('{"outer":{"inner":"value"}}');
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("outer:");
    expect(result.output).toContain("inner: value");
  });

  it("handles arrays", () => {
    const result = jsonToYaml('{"items":["a","b","c"]}');
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("items:");
    expect(result.output).toContain("- a");
    expect(result.output).toContain("- b");
    expect(result.output).toContain("- c");
  });
});
