import { describe, expect, it } from "bun:test";
import { generateUuid } from "./index";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("generateUuid", () => {
  it("returns a single UUID when called with no arguments", () => {
    const result = generateUuid();
    expect(result.uuids).toHaveLength(1);
    expect(UUID_V4_REGEX.test(result.uuids[0])).toBe(true);
  });

  it("returns 5 UUIDs when count is 5", () => {
    const result = generateUuid({ count: 5 });
    expect(result.uuids).toHaveLength(5);
  });

  it("all UUIDs match v4 format", () => {
    const result = generateUuid({ count: 10 });
    for (const uuid of result.uuids) {
      expect(UUID_V4_REGEX.test(uuid)).toBe(true);
    }
  });

  it("clamps count of 0 to 1 UUID", () => {
    const result = generateUuid({ count: 0 });
    expect(result.uuids).toHaveLength(1);
  });

  it("clamps negative count to 1 UUID", () => {
    const result = generateUuid({ count: -5 });
    expect(result.uuids).toHaveLength(1);
  });

  it("all UUIDs in a batch are unique", () => {
    const result = generateUuid({ count: 50 });
    const unique = new Set(result.uuids);
    expect(unique.size).toBe(50);
  });

  it("returns object with uuids array property", () => {
    const result = generateUuid();
    expect(result).toHaveProperty("uuids");
    expect(Array.isArray(result.uuids)).toBe(true);
  });

  it("returns a single UUID when count is 1 explicitly", () => {
    const result = generateUuid({ count: 1 });
    expect(result.uuids).toHaveLength(1);
    expect(UUID_V4_REGEX.test(result.uuids[0])).toBe(true);
  });
});
