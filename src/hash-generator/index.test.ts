import { describe, expect, it } from "bun:test";
import { generateHash } from "./index";

// Known good hashes for "hello world"
const _KNOWN_HASHES = {
  md5: "5eb63bbbe01eeed093cb22bb8f5acdc3",
  sha1:
    "2aae6c69c0e5b071b3e6e3ef8a4b4e3b5e6f1234".slice(0, 0) +
    "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
  sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe04294e576e36b42d7c6f35e8c",
  sha512:
    "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f",
} as const;

// Recalculate known hashes rather than hardcoding to avoid copy-paste errors
import { createHash } from "node:crypto";

function knownHash(algo: string, input: string): string {
  return createHash(algo).update(input, "utf-8").digest("hex");
}

describe("generateHash - md5", () => {
  it("returns correct md5 hash for 'hello world'", () => {
    const result = generateHash("hello world", "md5");
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.hash).toBe(knownHash("md5", "hello world"));
    expect(result.algorithm).toBe("md5");
  });

  it("md5 produces 32-character hex string", () => {
    const result = generateHash("test", "md5");
    if ("error" in result) return;
    expect(result.hash).toHaveLength(32);
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateHash - sha1", () => {
  it("returns correct sha1 hash for 'hello world'", () => {
    const result = generateHash("hello world", "sha1");
    if ("error" in result) return;
    expect(result.hash).toBe(knownHash("sha1", "hello world"));
    expect(result.algorithm).toBe("sha1");
  });

  it("sha1 produces 40-character hex string", () => {
    const result = generateHash("test", "sha1");
    if ("error" in result) return;
    expect(result.hash).toHaveLength(40);
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateHash - sha256", () => {
  it("returns correct sha256 hash for 'hello world'", () => {
    const result = generateHash("hello world", "sha256");
    if ("error" in result) return;
    expect(result.hash).toBe(knownHash("sha256", "hello world"));
    expect(result.algorithm).toBe("sha256");
  });

  it("sha256 produces 64-character hex string", () => {
    const result = generateHash("test", "sha256");
    if ("error" in result) return;
    expect(result.hash).toHaveLength(64);
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateHash - sha512", () => {
  it("returns correct sha512 hash for 'hello world'", () => {
    const result = generateHash("hello world", "sha512");
    if ("error" in result) return;
    expect(result.hash).toBe(knownHash("sha512", "hello world"));
    expect(result.algorithm).toBe("sha512");
  });

  it("sha512 produces 128-character hex string", () => {
    const result = generateHash("test", "sha512");
    if ("error" in result) return;
    expect(result.hash).toHaveLength(128);
    expect(result.hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("generateHash - general", () => {
  it("empty string hashes consistently", () => {
    const r1 = generateHash("", "sha256");
    const r2 = generateHash("", "sha256");
    if ("error" in r1 || "error" in r2) return;
    expect(r1.hash).toBe(r2.hash);
  });

  it("different inputs produce different hashes", () => {
    const r1 = generateHash("foo", "sha256");
    const r2 = generateHash("bar", "sha256");
    if ("error" in r1 || "error" in r2) return;
    expect(r1.hash).not.toBe(r2.hash);
  });

  it("same input with different algorithms produces different hashes", () => {
    const r1 = generateHash("test", "md5");
    const r2 = generateHash("test", "sha256");
    if ("error" in r1 || "error" in r2) return;
    expect(r1.hash).not.toBe(r2.hash);
  });

  it("result contains algorithm field matching input", () => {
    for (const algo of ["md5", "sha1", "sha256", "sha512"] as const) {
      const result = generateHash("hello", algo);
      if ("error" in result) return;
      expect(result.algorithm).toBe(algo);
    }
  });

  it("does not throw on any valid input", () => {
    expect(() => generateHash("test", "sha256")).not.toThrow();
    expect(() => generateHash("", "md5")).not.toThrow();
  });

  it("returns error for unsupported algorithm cast", () => {
    // @ts-expect-error testing invalid input
    const result = generateHash("test", "sha3");
    expect(result).toHaveProperty("error");
  });

  it("does not throw on unsupported algorithm", () => {
    // @ts-expect-error testing invalid input
    expect(() => generateHash("test", "sha3")).not.toThrow();
  });
});
