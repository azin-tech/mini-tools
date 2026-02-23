import { describe, expect, it } from "bun:test";
import { formatYaml } from "./index";

describe("formatYaml", () => {
  it("expands compact inline YAML to block style with default indent of 2", () => {
    const result = formatYaml("{a: 1, b: 2}");
    expect(result.error).toBeUndefined();
    // js-yaml dump always puts each key on its own line
    expect(result.output).toContain("a: 1");
    expect(result.output).toContain("b: 2");
  });

  it("formats with indent 4 when specified", () => {
    const input = "outer:\n  inner: value";
    const result = formatYaml(input, { indent: 4 });
    expect(result.error).toBeUndefined();
    // With indent 4, nested key should be indented by 4 spaces
    expect(result.output).toMatch(/^ {4}inner: value/m);
  });

  it("handles multi-document YAML with --- separator", () => {
    const result = formatYaml("---\na: 1\n---\nb: 2\n");
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("a: 1");
    expect(result.output).toContain("b: 2");
    expect(result.output).toContain("---");
  });

  it("returns an error for invalid YAML input", () => {
    const result = formatYaml("key: [unclosed");
    expect(result.output).toBe("");
    expect(result.error).toBeTruthy();
  });
});
