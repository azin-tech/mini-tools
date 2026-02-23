import { describe, expect, it } from "bun:test";
import { decodeJwt } from "./index";

// Tokens built with header: { alg: "HS256", typ: "JWT" } — signatures are fake (not verified)
const EXPIRED_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Valid token: exp = now + 1h (approximate — will not be expired during test run)
const VALID_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiI5ODc2NTQzMjEwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3NzE4Nzk2MjV9" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Token with no exp claim
const NO_EXP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
  ".eyJzdWIiOiJhYmMiLCJyb2xlIjoiYWRtaW4ifQ" +
  ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

describe("decodeJwt - valid tokens", () => {
  it("decodes header correctly", () => {
    const result = decodeJwt(EXPIRED_TOKEN);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.header).toEqual({ alg: "HS256", typ: "JWT" });
  });

  it("decodes payload correctly", () => {
    const result = decodeJwt(EXPIRED_TOKEN);
    if ("error" in result) return;
    expect(result.payload.sub).toBe("1234567890");
    expect(result.payload.name).toBe("John Doe");
  });

  it("preserves the raw signature", () => {
    const result = decodeJwt(EXPIRED_TOKEN);
    if ("error" in result) return;
    expect(result.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
  });

  it("marks expired token as isExpired: true", () => {
    const result = decodeJwt(EXPIRED_TOKEN);
    if ("error" in result) return;
    expect(result.isExpired).toBe(true);
  });

  it("sets expiresAt as ISO string for expired token", () => {
    const result = decodeJwt(EXPIRED_TOKEN);
    if ("error" in result) return;
    expect(typeof result.expiresAt).toBe("string");
    expect(result.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("marks non-expired token as isExpired: false", () => {
    const result = decodeJwt(VALID_TOKEN);
    if ("error" in result) return;
    expect(result.isExpired).toBe(false);
  });

  it("does not set isExpired or expiresAt when exp claim is absent", () => {
    const result = decodeJwt(NO_EXP_TOKEN);
    if ("error" in result) return;
    expect(result.isExpired).toBeUndefined();
    expect(result.expiresAt).toBeUndefined();
  });

  it("decodes payload of token without exp", () => {
    const result = decodeJwt(NO_EXP_TOKEN);
    if ("error" in result) return;
    expect(result.payload.sub).toBe("abc");
    expect(result.payload.role).toBe("admin");
  });
});

describe("decodeJwt - error cases", () => {
  it("returns error for token with only 2 parts", () => {
    const result = decodeJwt("header.payload");
    expect(result).toHaveProperty("error");
  });

  it("returns error for token with 4 parts", () => {
    const result = decodeJwt("a.b.c.d");
    expect(result).toHaveProperty("error");
  });

  it("returns error for empty string", () => {
    const result = decodeJwt("");
    expect(result).toHaveProperty("error");
  });

  it("returns error for non-JSON header", () => {
    // base64url of "not-json"
    const result = decodeJwt("bm90LWpzb24.eyJzdWIiOiJ0ZXN0In0.sig");
    expect(result).toHaveProperty("error");
  });

  it("returns error for non-JSON payload", () => {
    const result = decodeJwt("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.bm90LWpzb24.sig");
    expect(result).toHaveProperty("error");
  });

  it("does not throw on any input", () => {
    expect(() => decodeJwt("not.a.jwt")).not.toThrow();
    expect(() => decodeJwt("")).not.toThrow();
    expect(() => decodeJwt("one-part-only")).not.toThrow();
  });
});
