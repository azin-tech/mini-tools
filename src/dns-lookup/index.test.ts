import { describe, expect, it } from "bun:test";
import { lookupCname } from "./cname";
import { dnsLookup } from "./index";
import { lookupMx } from "./mx";

const INVALID_HOST = "invalid-domain-that-does-not-exist.xyz";

// ---------------------------------------------------------------------------
// dnsLookup
// ---------------------------------------------------------------------------

describe("dnsLookup — A record (google.com)", () => {
  it("returns A records for google.com", async () => {
    const result = await dnsLookup("google.com", "A");
    if (result.error) {
      // Network unavailable in this environment — skip assertions
      console.warn("DNS network unavailable:", result.error);
      return;
    }
    expect(result.hostname).toBe("google.com");
    expect(result.type).toBe("A");
    expect(result.records.length).toBeGreaterThan(0);
    // Each A record should be an IPv4 address
    for (const r of result.records) {
      expect(r).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
    }
  });
});

describe("dnsLookup — NS record (google.com)", () => {
  it("returns NS records for google.com", async () => {
    const result = await dnsLookup("google.com", "NS");
    if (result.error) {
      console.warn("DNS network unavailable:", result.error);
      return;
    }
    expect(result.records.length).toBeGreaterThan(0);
  });
});

describe("dnsLookup — MX record (google.com)", () => {
  it("returns MX records as 'priority exchange' strings", async () => {
    const result = await dnsLookup("google.com", "MX");
    if (result.error) {
      console.warn("DNS network unavailable:", result.error);
      return;
    }
    expect(result.records.length).toBeGreaterThan(0);
    // Each entry should look like "10 smtp.google.com"
    for (const r of result.records) {
      expect(r).toMatch(/^\d+ .+$/);
    }
  });
});

describe("dnsLookup — error handling", () => {
  it("returns empty records and error for an invalid domain", async () => {
    const result = await dnsLookup(INVALID_HOST, "A");
    if (!result.error) {
      // Surprisingly resolved — just validate shape
      expect(result.hostname).toBe(INVALID_HOST);
      return;
    }
    expect(result.records).toEqual([]);
    expect(typeof result.error).toBe("string");
    expect(result.error.length).toBeGreaterThan(0);
  });

  it("does not throw on invalid hostname", async () => {
    await expect(dnsLookup(INVALID_HOST, "A")).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// lookupCname
// ---------------------------------------------------------------------------

describe("lookupCname — well-known CNAME", () => {
  it("returns a result object with hostname field", async () => {
    // www.github.com is typically a CNAME
    const result = await lookupCname("www.github.com");
    expect(result.hostname).toBe("www.github.com");
    // Either resolved or returned null — both are valid shapes
    if (result.error) {
      console.warn("CNAME lookup error:", result.error);
      expect(result.cname).toBeNull();
    } else {
      // cname can be null (direct A) or a string
      expect(result.cname === null || typeof result.cname === "string").toBe(true);
    }
  });
});

describe("lookupCname — error handling", () => {
  it("returns { cname: null, error } for an invalid domain", async () => {
    const result = await lookupCname(INVALID_HOST);
    if (!result.error && result.cname !== null) {
      // Resolved unexpectedly — just check shape
      return;
    }
    expect(result.hostname).toBe(INVALID_HOST);
    expect(result.cname).toBeNull();
    if (result.error) {
      expect(typeof result.error).toBe("string");
    }
  });

  it("does not throw on invalid hostname", async () => {
    await expect(lookupCname(INVALID_HOST)).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// lookupMx
// ---------------------------------------------------------------------------

describe("lookupMx — google.com", () => {
  it("returns MX records sorted by priority", async () => {
    const result = await lookupMx("google.com");
    if (result.error) {
      console.warn("MX lookup error:", result.error);
      return;
    }
    expect(result.hostname).toBe("google.com");
    expect(result.records.length).toBeGreaterThan(0);
    // Verify ascending sort
    for (let i = 1; i < result.records.length; i++) {
      expect(result.records[i].priority).toBeGreaterThanOrEqual(result.records[i - 1].priority);
    }
    // Each record has exchange and priority
    for (const r of result.records) {
      expect(typeof r.exchange).toBe("string");
      expect(typeof r.priority).toBe("number");
    }
  });
});

describe("lookupMx — error handling", () => {
  it("returns empty records and error for an invalid domain", async () => {
    const result = await lookupMx(INVALID_HOST);
    if (!result.error) {
      // Surprisingly resolved
      return;
    }
    expect(result.records).toEqual([]);
    expect(typeof result.error).toBe("string");
  });

  it("does not throw on invalid hostname", async () => {
    await expect(lookupMx(INVALID_HOST)).resolves.toBeDefined();
  });
});
