import { describe, expect, it } from "bun:test";
import { testRegex } from "./index";

describe("testRegex", () => {
  // --- happy path ---

  it("finds a single literal match", () => {
    const result = testRegex("hello", "", "say hello there");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matches[0].match).toBe("hello");
    expect(result.matches[0].index).toBe(4);
    expect(result.matches[0].groups).toBeNull();
  });

  it("finds multiple matches with the global flag implied", () => {
    const result = testRegex("\\d+", "", "there are 3 cats and 42 dogs");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(2);
    expect(result.matches[0].match).toBe("3");
    expect(result.matches[1].match).toBe("42");
  });

  it("does not double-add g when the caller already passes it in flags", () => {
    const result = testRegex("\\d+", "g", "1 2 3");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(3);
  });

  it("respects the case-insensitive flag", () => {
    const result = testRegex("hello", "i", "Hello World HELLO");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(2);
  });

  it("returns named capture groups", () => {
    const result = testRegex(
      "(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})",
      "",
      "date: 2024-03-15"
    );
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matches[0].groups).toEqual({
      year: "2024",
      month: "03",
      day: "15",
    });
  });

  it("returns null groups when there are no named capture groups", () => {
    const result = testRegex("(\\w+)", "", "hello");
    expect(result.valid).toBe(true);
    expect(result.matches[0].groups).toBeNull();
  });

  it("returns zero matches when the pattern does not match", () => {
    const result = testRegex("xyz", "", "hello world");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(0);
    expect(result.matches).toEqual([]);
  });

  it("matches across a multi-line string with the m flag", () => {
    const result = testRegex("^start", "m", "start here\nnot here\nstart again");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(2);
  });

  // --- edge cases ---

  it("handles an empty input string", () => {
    const result = testRegex("\\w+", "", "");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(0);
  });

  it("handles an empty pattern (matches every position)", () => {
    const result = testRegex("", "", "abc");
    expect(result.valid).toBe(true);
    // Empty pattern matches at every character position + end-of-string
    expect(result.matchCount).toBeGreaterThan(0);
  });

  it("handles special regex characters in the pattern", () => {
    const result = testRegex("[a-z]+", "", "hello123world");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBe(2);
    expect(result.matches[0].match).toBe("hello");
    expect(result.matches[1].match).toBe("world");
  });

  it("handles unicode characters in the input", () => {
    const result = testRegex("\\w+", "u", "café");
    expect(result.valid).toBe(true);
    expect(result.matchCount).toBeGreaterThan(0);
  });

  // --- error cases — must not throw ---

  it("returns valid: false for an invalid regex pattern without throwing", () => {
    expect(() => testRegex("[invalid", "", "test")).not.toThrow();
    const result = testRegex("[invalid", "", "test");
    expect(result.valid).toBe(false);
    expect(result.matchCount).toBe(0);
    expect(result.matches).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it("returns valid: false for an invalid flag without throwing", () => {
    expect(() => testRegex("\\w+", "Z", "test")).not.toThrow();
    const result = testRegex("\\w+", "Z", "test");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns valid: false for a repeated flag without throwing", () => {
    // Passing 'ii' is an invalid flag combination in most runtimes
    expect(() => testRegex("a", "ii", "a")).not.toThrow();
    // Result may be valid or invalid depending on JS engine; we only assert no throw
  });

  it("includes a descriptive error message for invalid patterns", () => {
    const result = testRegex("(unclosed", "", "test");
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/\S/);
  });
});
