import { describe, expect, it } from "bun:test";
import { validateYaml } from "./index";

describe("validateYaml", () => {
  it("returns valid for a simple key-value pair", () => {
    const result = validateYaml("key: value");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid for multi-document YAML", () => {
    const result = validateYaml("---\na: 1\n---\nb: 2");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns invalid with an error message for malformed YAML", () => {
    const result = validateYaml("key: [unclosed");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toBeTruthy();
  });

  it("returns valid for an empty string (empty document is valid YAML)", () => {
    const result = validateYaml("");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
