import { describe, expect, it } from "bun:test";
import { base64Decode, base64Encode, isValidBase64 } from "./index";

describe("base64Encode", () => {
  it('encodes "hello world" to "aGVsbG8gd29ybGQ="', () => {
    expect(base64Encode("hello world")).toEqual({ output: "aGVsbG8gd29ybGQ=" });
  });

  it("encodes an empty string", () => {
    expect(base64Encode("")).toEqual({ output: "" });
  });

  it("encodes special characters", () => {
    const result = base64Encode("hello\nworld\t!");
    expect(result.output).toBeTruthy();
    expect(result.output).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
  });

  it("encodes unicode characters", () => {
    const result = base64Encode("こんにちは");
    expect(result.output).toBeTruthy();
    // Decoding the encoded unicode should round-trip
    const decoded = base64Decode(result.output);
    expect(decoded.output).toBe("こんにちは");
  });
});

describe("base64Decode", () => {
  it('decodes "aGVsbG8gd29ybGQ=" to "hello world"', () => {
    expect(base64Decode("aGVsbG8gd29ybGQ=")).toEqual({ output: "hello world" });
  });

  it("returns error for invalid base64 input", () => {
    const result = base64Decode("not-valid-base64!!!");
    expect(result.output).toBe("");
    expect(result.error).toBe("Invalid base64 string");
  });

  it("decodes special characters correctly", () => {
    const encoded = base64Encode("hello\nworld\t!");
    const decoded = base64Decode(encoded.output);
    expect(decoded.output).toBe("hello\nworld\t!");
    expect(decoded.error).toBeUndefined();
  });

  it("does not throw on invalid input", () => {
    expect(() => base64Decode("!!!")).not.toThrow();
  });
});

describe("round-trip encode then decode", () => {
  it("round-trips plain ASCII text", () => {
    const original = "Hello, World!";
    const { output: encoded } = base64Encode(original);
    const { output: decoded } = base64Decode(encoded);
    expect(decoded).toBe(original);
  });

  it("round-trips unicode text", () => {
    const original = "日本語テスト";
    const { output: encoded } = base64Encode(original);
    const { output: decoded } = base64Decode(encoded);
    expect(decoded).toBe(original);
  });

  it("round-trips text with newlines and tabs", () => {
    const original = "line1\nline2\ttabbed";
    const { output: encoded } = base64Encode(original);
    const { output: decoded } = base64Decode(encoded);
    expect(decoded).toBe(original);
  });
});

describe("isValidBase64", () => {
  it("returns true for a valid base64 string", () => {
    expect(isValidBase64("aGVsbG8gd29ybGQ=")).toBe(true);
  });

  it("returns true for an empty string (zero-length is valid)", () => {
    expect(isValidBase64("")).toBe(true);
  });

  it("returns false for a string with invalid characters", () => {
    expect(isValidBase64("not-valid-base64!!!")).toBe(false);
  });

  it("returns false for a string with wrong padding length", () => {
    // "aGVs" is valid (length 4), "aGVsb" is length 5 (not multiple of 4)
    expect(isValidBase64("aGVsb")).toBe(false);
  });

  it("returns true for URL-safe base64 (- and _ normalized)", () => {
    // URL-safe base64 uses - instead of + and _ instead of /
    const urlSafe = base64Encode("hello world").output.replace(/\+/g, "-").replace(/\//g, "_");
    expect(isValidBase64(urlSafe)).toBe(true);
  });

  it("returns true for base64 without padding (empty string case)", () => {
    expect(isValidBase64("AAAA")).toBe(true);
  });
});
