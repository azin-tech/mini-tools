export interface UptimeResult {
  percentage: number;
  maxDowntimePerDay: string;
  maxDowntimePerWeek: string;
  maxDowntimePerMonth: string;
  maxDowntimePerYear: string;
}

const SECONDS_PER_DAY = 86_400;
const SECONDS_PER_WEEK = 604_800;
const SECONDS_PER_MONTH = 2_592_000; // 30 days
const SECONDS_PER_YEAR = 31_536_000; // 365 days

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);

  return parts.length > 0 ? parts.join(" ") : "0s";
}

/**
 * Calculate maximum allowable downtime for a given uptime percentage.
 *
 * @param percentage - Uptime percentage between 0 and 100 (e.g. 99.9)
 * @returns UptimeResult with formatted downtime per period, or an error object
 */
export function calculateUptime(percentage: number): UptimeResult | { error: string } {
  if (percentage < 0 || percentage > 100) {
    return { error: "Percentage must be between 0 and 100" };
  }

  const downtime = 1 - percentage / 100;

  return {
    percentage,
    maxDowntimePerDay: formatDuration(downtime * SECONDS_PER_DAY),
    maxDowntimePerWeek: formatDuration(downtime * SECONDS_PER_WEEK),
    maxDowntimePerMonth: formatDuration(downtime * SECONDS_PER_MONTH),
    maxDowntimePerYear: formatDuration(downtime * SECONDS_PER_YEAR),
  };
}
