import { describe, expect, it } from "bun:test";
import { describeCron, generateCron, PRESETS } from "./index";

describe("generateCron with presets", () => {
  it('preset "daily" produces "0 0 * * *"', () => {
    const result = generateCron({ preset: "daily" });
    expect(result.expression).toBe("0 0 * * *");
    // Description should mention midnight or 12:00 AM
    expect(result.description.toLowerCase()).toMatch(/12:00 am|midnight/);
  });

  it('preset "hourly" produces "0 * * * *"', () => {
    const result = generateCron({ preset: "hourly" });
    expect(result.expression).toBe("0 * * * *");
    expect(result.description).toBeTruthy();
  });

  it('preset "weekly" produces "0 0 * * 0"', () => {
    const result = generateCron({ preset: "weekly" });
    expect(result.expression).toBe("0 0 * * 0");
    expect(result.description).toBeTruthy();
  });

  it('preset "monthly" produces "0 0 1 * *"', () => {
    const result = generateCron({ preset: "monthly" });
    expect(result.expression).toBe("0 0 1 * *");
    expect(result.description).toBeTruthy();
  });

  it('preset "yearly" produces "0 0 1 1 *"', () => {
    const result = generateCron({ preset: "yearly" });
    expect(result.expression).toBe("0 0 1 1 *");
    expect(result.description).toBeTruthy();
  });

  it("all presets produce valid non-empty descriptions", () => {
    const presetKeys = Object.keys(PRESETS) as Array<keyof typeof PRESETS>;
    for (const preset of presetKeys) {
      const result = generateCron({ preset });
      expect(result.expression).toBe(PRESETS[preset]);
      expect(result.description.length).toBeGreaterThan(0);
    }
  });
});

describe("generateCron with custom fields", () => {
  it("builds expression from hour and minute fields", () => {
    const result = generateCron({ hour: "9", minute: "30" });
    expect(result.expression).toBe("30 9 * * *");
  });

  it("uses all defaults when called with empty options", () => {
    const result = generateCron({});
    expect(result.expression).toBe("* * * * *");
    expect(result.description).toBeTruthy();
  });

  it("builds expression with all custom fields", () => {
    const result = generateCron({ minute: "0", hour: "12", day: "1", month: "6", weekday: "1" });
    expect(result.expression).toBe("0 12 1 6 1");
  });

  it("includes description in result", () => {
    const result = generateCron({ hour: "9", minute: "0" });
    expect(typeof result.description).toBe("string");
    expect(result.description.length).toBeGreaterThan(0);
  });
});

describe("generateCron error handling", () => {
  it("returns error and empty description for out-of-range hour value", () => {
    const result = generateCron({ hour: "99" });
    expect(result.description).toBe("");
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe("string");
  });
});

describe("describeCron", () => {
  it('describes "*/15 * * * *" with 15 minutes reference', () => {
    const result = describeCron("*/15 * * * *");
    expect(result.description.toLowerCase()).toContain("15 minute");
    expect(result.error).toBeUndefined();
  });

  it("returns error for an invalid expression", () => {
    const result = describeCron("invalid expr");
    expect(result.description).toBe("");
    expect(result.error).toBeTruthy();
    expect(typeof result.error).toBe("string");
  });

  it("returns error for a completely empty string", () => {
    const result = describeCron("");
    expect(result.description).toBe("");
    expect(result.error).toBeTruthy();
  });

  it('describes "0 9 * * 1" correctly', () => {
    const result = describeCron("0 9 * * 1");
    expect(result.description).toBeTruthy();
    expect(result.error).toBeUndefined();
  });
});
