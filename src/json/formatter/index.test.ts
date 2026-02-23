import { describe, expect, it } from "bun:test";
import { formatJson } from "./index";

describe("formatJson", () => {
  // --- happy path ---

  it("formats a flat object with default indent of 2", () => {
    const result = formatJson('{"b":2,"a":1}');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe('{\n  "b": 2,\n  "a": 1\n}');
  });

  it("formats with indent 4 when specified", () => {
    const result = formatJson('{"key":"value"}', { indent: 4 });
    expect(result.error).toBeUndefined();
    expect(result.output).toBe('{\n    "key": "value"\n}');
  });

  it("formats a nested object", () => {
    const result = formatJson('{"outer":{"inner":42}}');
    expect(result.error).toBeUndefined();
    expect(result.output).toContain('"outer"');
    expect(result.output).toContain('"inner": 42');
  });

  it("formats a JSON array", () => {
    const result = formatJson("[1,2,3]");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("[\n  1,\n  2,\n  3\n]");
  });

  it("formats a JSON string scalar", () => {
    const result = formatJson('"hello"');
    expect(result.error).toBeUndefined();
    expect(result.output).toBe('"hello"');
  });

  it("formats a JSON number scalar", () => {
    const result = formatJson("42");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("42");
  });

  it("formats a JSON boolean scalar", () => {
    const result = formatJson("true");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("true");
  });

  it("formats null", () => {
    const result = formatJson("null");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("null");
  });

  // --- sortKeys ---

  it("sorts object keys alphabetically when sortKeys is true", () => {
    const result = formatJson('{"z":3,"a":1,"m":2}', { sortKeys: true });
    expect(result.error).toBeUndefined();
    const keys = [...result.output.matchAll(/"(\w+)":/g)].map((m) => m[1]);
    expect(keys).toEqual(["a", "m", "z"]);
  });

  it("sorts nested object keys recursively when sortKeys is true", () => {
    const result = formatJson('{"b":{"z":1,"a":2},"a":0}', { sortKeys: true });
    expect(result.error).toBeUndefined();
    const keys = [...result.output.matchAll(/"(\w+)":/g)].map((m) => m[1]);
    // outer: a, b — then inner: a, z
    expect(keys).toEqual(["a", "b", "a", "z"]);
  });

  it("does not sort keys when sortKeys is false (default)", () => {
    const input = '{"z":3,"a":1,"m":2}';
    const result = formatJson(input);
    expect(result.error).toBeUndefined();
    const keys = [...result.output.matchAll(/"(\w+)":/g)].map((m) => m[1]);
    expect(keys).toEqual(["z", "a", "m"]);
  });

  it("sortKeys leaves arrays in their original order", () => {
    const result = formatJson('{"arr":[3,1,2]}', { sortKeys: true });
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("[\n    3,\n    1,\n    2\n  ]");
  });

  // --- edge cases ---

  it("returns formatted output for an empty object", () => {
    const result = formatJson("{}");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("{}");
  });

  it("returns formatted output for an empty array", () => {
    const result = formatJson("[]");
    expect(result.error).toBeUndefined();
    expect(result.output).toBe("[]");
  });

  it("handles unicode characters without escaping them", () => {
    const result = formatJson('{"greeting":"こんにちは"}');
    expect(result.error).toBeUndefined();
    expect(result.output).toContain("こんにちは");
  });

  it("preserves already-formatted JSON (idempotent)", () => {
    const formatted = '{\n  "a": 1\n}';
    const result = formatJson(formatted);
    expect(result.error).toBeUndefined();
    expect(result.output).toBe(formatted);
  });

  // --- error cases — must not throw ---

  it("returns an error for an empty string without throwing", () => {
    expect(() => formatJson("")).not.toThrow();
    const result = formatJson("");
    expect(result.output).toBe("");
    expect(result.error).toMatch(/Invalid JSON/i);
  });

  it("returns an error for invalid JSON (trailing comma) without throwing", () => {
    expect(() => formatJson('{"a":1,}')).not.toThrow();
    const result = formatJson('{"a":1,}');
    expect(result.output).toBe("");
    expect(result.error).toMatch(/Invalid JSON/i);
  });

  it("returns an error for completely non-JSON text without throwing", () => {
    expect(() => formatJson("not json at all")).not.toThrow();
    const result = formatJson("not json at all");
    expect(result.output).toBe("");
    expect(result.error).toBeTruthy();
  });

  it("returns an error for unterminated string without throwing", () => {
    expect(() => formatJson('{"key": "unclosed')).not.toThrow();
    const result = formatJson('{"key": "unclosed');
    expect(result.output).toBe("");
    expect(result.error).toMatch(/Invalid JSON/i);
  });
});
