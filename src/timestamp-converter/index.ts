export interface TimestampResult {
  unix: number;
  unixMs: number;
  iso: string;
  utc: string;
  local: string;
  relative: string;
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const absMs = Math.abs(diffMs);
  const isFuture = diffMs < 0;

  const seconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));

  let label: string;

  if (seconds < 60) {
    label = seconds === 1 ? "1 second" : `${seconds} seconds`;
  } else if (minutes < 60) {
    label = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  } else if (hours < 24) {
    label = hours === 1 ? "1 hour" : `${hours} hours`;
  } else {
    label = days === 1 ? "1 day" : `${days} days`;
  }

  return isFuture ? `in ${label}` : `${label} ago`;
}

function buildResult(date: Date): TimestampResult {
  const unixMs = date.getTime();
  return {
    unix: Math.floor(unixMs / 1000),
    unixMs,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString("en-US"),
    relative: formatRelative(date),
  };
}

export function convertTimestamp(input: string | number): TimestampResult | { error: string } {
  let date: Date;

  if (typeof input === "number") {
    // Auto-detect: < 1e10 means seconds, >= 1e10 means milliseconds
    const ms = input < 1e10 ? input * 1000 : input;
    date = new Date(ms);
  } else {
    date = new Date(input);
  }

  if (Number.isNaN(date.getTime())) {
    return { error: `Invalid timestamp: "${input}"` };
  }

  return buildResult(date);
}

export function nowTimestamp(): TimestampResult {
  return buildResult(new Date());
}
