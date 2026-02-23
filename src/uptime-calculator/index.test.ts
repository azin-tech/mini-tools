import { describe, expect, it } from "bun:test";
import { calculateUptime } from "./index";

describe("calculateUptime", () => {
  it("returns correct downtime strings for 99.9% uptime", () => {
    const result = calculateUptime(99.9);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.percentage).toBe(99.9);
    expect(result.maxDowntimePerDay).toBe("1m 26s");
    expect(result.maxDowntimePerWeek).toBe("10m 4s");
    expect(result.maxDowntimePerMonth).toBe("43m 11s");
    expect(result.maxDowntimePerYear).toBe("8h 45m 35s");
  });

  it("returns correct downtime strings for 99.99% uptime", () => {
    const result = calculateUptime(99.99);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.maxDowntimePerDay).toBe("8s");
    expect(result.maxDowntimePerWeek).toBe("1m");
  });

  it("returns correct downtime for 100% uptime (all zeros)", () => {
    const result = calculateUptime(100);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.maxDowntimePerDay).toBe("0s");
    expect(result.maxDowntimePerWeek).toBe("0s");
    expect(result.maxDowntimePerMonth).toBe("0s");
    expect(result.maxDowntimePerYear).toBe("0s");
  });

  it("returns correct downtime for 0% uptime (full period)", () => {
    const result = calculateUptime(0);
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.maxDowntimePerDay).toBe("24h");
    expect(result.maxDowntimePerYear).toBe("8760h");
  });

  it("returns error for percentage below 0", () => {
    const result = calculateUptime(-1);
    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;
    expect(result.error).toBe("Percentage must be between 0 and 100");
  });

  it("returns error for percentage above 100", () => {
    const result = calculateUptime(101);
    expect(result).toHaveProperty("error");
    if (!("error" in result)) return;
    expect(result.error).toBe("Percentage must be between 0 and 100");
  });

  it("does not throw on any valid input", () => {
    expect(() => calculateUptime(50)).not.toThrow();
    expect(() => calculateUptime(99.999)).not.toThrow();
  });

  it("returns object with all required fields for valid input", () => {
    const result = calculateUptime(99.9);
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("maxDowntimePerDay");
    expect(result).toHaveProperty("maxDowntimePerWeek");
    expect(result).toHaveProperty("maxDowntimePerMonth");
    expect(result).toHaveProperty("maxDowntimePerYear");
  });

  it("omits zero parts in formatted output", () => {
    // 99.99% — day downtime is ~8.6s, so no hours or minutes
    const result = calculateUptime(99.99);
    if ("error" in result) return;
    expect(result.maxDowntimePerDay).not.toContain("h");
    expect(result.maxDowntimePerDay).not.toContain("m");
  });
});
