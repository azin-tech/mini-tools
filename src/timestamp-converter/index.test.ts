import { describe, expect, it } from "bun:test";
import { convertTimestamp, nowTimestamp } from "./index";

// 2024-01-15T10:30:00.000Z in Unix seconds
const UNIX_SECONDS = 1705315800;
// Same moment in ms
const UNIX_MS = 1705315800000;
const ISO_STRING = "2024-01-15T10:50:00.000Z";

describe("convertTimestamp — Unix seconds input", () => {
  it("returns a TimestampResult (no error)", () => {
    const result = convertTimestamp(UNIX_SECONDS);
    expect("error" in result).toBe(false);
  });

  it("unix field equals the input seconds", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.unix).toBe(UNIX_SECONDS);
  });

  it("unixMs field equals the input * 1000", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.unixMs).toBe(UNIX_MS);
  });

  it("iso field matches expected ISO string", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.iso).toBe(ISO_STRING);
  });

  it("utc field is a non-empty string", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.utc.length).toBeGreaterThan(0);
  });

  it("local field is a non-empty string", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.local.length).toBeGreaterThan(0);
  });

  it("relative field contains 'ago' for a past date", () => {
    const result = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    expect(result.relative).toMatch(/ago$/);
  });
});

describe("convertTimestamp — Unix ms input", () => {
  it("auto-detects ms when value >= 1e10", () => {
    const result = convertTimestamp(UNIX_MS) as ReturnType<typeof nowTimestamp>;
    expect(result.unixMs).toBe(UNIX_MS);
  });

  it("produces the same result as the seconds input", () => {
    const fromSeconds = convertTimestamp(UNIX_SECONDS) as ReturnType<typeof nowTimestamp>;
    const fromMs = convertTimestamp(UNIX_MS) as ReturnType<typeof nowTimestamp>;
    expect(fromMs.iso).toBe(fromSeconds.iso);
  });
});

describe("convertTimestamp — ISO string input", () => {
  it("parses an ISO date string", () => {
    const result = convertTimestamp(ISO_STRING) as ReturnType<typeof nowTimestamp>;
    expect("error" in result).toBe(false);
    expect(result.iso).toBe(ISO_STRING);
  });

  it("parses a date-only string", () => {
    const result = convertTimestamp("2024-01-15") as ReturnType<typeof nowTimestamp>;
    expect("error" in result).toBe(false);
    expect(result.unix).toBeGreaterThan(0);
  });
});

describe("convertTimestamp — invalid input", () => {
  it("returns { error } for a garbage string", () => {
    const result = convertTimestamp("not-a-date");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(typeof result.error).toBe("string");
      expect(result.error.length).toBeGreaterThan(0);
    }
  });

  it("does not throw on invalid input", () => {
    expect(() => convertTimestamp("!!!")).not.toThrow();
  });

  it("does not throw on NaN number input", () => {
    expect(() => convertTimestamp(Number.NaN)).not.toThrow();
  });
});

describe("nowTimestamp", () => {
  it("returns a result without an error", () => {
    const result = nowTimestamp();
    expect("error" in result).toBe(false);
  });

  it("unix is close to Date.now() / 1000", () => {
    const before = Math.floor(Date.now() / 1000);
    const result = nowTimestamp();
    const after = Math.floor(Date.now() / 1000);
    expect(result.unix).toBeGreaterThanOrEqual(before);
    expect(result.unix).toBeLessThanOrEqual(after);
  });

  it("unixMs is close to Date.now()", () => {
    const before = Date.now();
    const result = nowTimestamp();
    const after = Date.now();
    expect(result.unixMs).toBeGreaterThanOrEqual(before);
    expect(result.unixMs).toBeLessThanOrEqual(after);
  });

  it("iso is a valid ISO 8601 string", () => {
    const result = nowTimestamp();
    expect(result.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("relative field says 'ago' or 'in' (within seconds of now)", () => {
    const result = nowTimestamp();
    expect(result.relative).toMatch(/(ago$|^in )/);
  });
});
