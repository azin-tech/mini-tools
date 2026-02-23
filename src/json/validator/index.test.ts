import { describe, expect, it } from "bun:test";
import { validateJson } from "./index";

describe("validateJson", () => {
  // --- happy path (valid JSON) ---

  it("validates a simple object", () => {
    const result = validateJson('{"a":1}');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates a nested object", () => {
    const result = validateJson('{"outer":{"inner":[1,2,3]}}');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates an array", () => {
    const result = validateJson("[1, 2, 3]");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates a string scalar", () => {
    const result = validateJson('"hello world"');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates a number scalar", () => {
    const result = validateJson("3.14");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates a boolean scalar", () => {
    const result = validateJson("false");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates null", () => {
    const result = validateJson("null");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates an empty object", () => {
    const result = validateJson("{}");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates an empty array", () => {
    const result = validateJson("[]");
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("validates JSON with unicode characters", () => {
    const result = validateJson('{"msg":"日本語"}');
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  // --- error cases (invalid JSON — must not throw) ---

  it("returns invalid for an empty string without throwing", () => {
    expect(() => validateJson("")).not.toThrow();
    const result = validateJson("");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid for a trailing comma", () => {
    const result = validateJson('{"a":1,}');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid for a missing closing brace", () => {
    const result = validateJson('{"a":1');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid for an unquoted key", () => {
    const result = validateJson("{a:1}");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid for plain text without throwing", () => {
    expect(() => validateJson("not json")).not.toThrow();
    const result = validateJson("not json");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toBeTruthy();
  });

  it("includes the SyntaxError message in errors array", () => {
    const result = validateJson("{bad}");
    expect(result.valid).toBe(false);
    // The native SyntaxError message always contains some description
    expect(result.errors[0]).toMatch(/\S/);
  });

  it("returns invalid for single quotes instead of double quotes", () => {
    const result = validateJson("{'a':1}");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
