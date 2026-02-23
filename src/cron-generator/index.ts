import cronstrue from "cronstrue";

export interface CronOptions {
  minute?: string;
  hour?: string;
  day?: string;
  month?: string;
  weekday?: string;
  preset?: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
}

export interface CronResult {
  expression: string;
  description: string;
  error?: string;
}

export const PRESETS: Record<NonNullable<CronOptions["preset"]>, string> = {
  hourly: "0 * * * *",
  daily: "0 0 * * *",
  weekly: "0 0 * * 0",
  monthly: "0 0 1 * *",
  yearly: "0 0 1 1 *",
};

export function generateCron(options: CronOptions): CronResult {
  const expression =
    options.preset !== undefined
      ? PRESETS[options.preset]
      : [
          options.minute ?? "*",
          options.hour ?? "*",
          options.day ?? "*",
          options.month ?? "*",
          options.weekday ?? "*",
        ].join(" ");

  try {
    const description = cronstrue.toString(expression);
    return { expression, description };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { expression, description: "", error };
  }
}

export function describeCron(expression: string): { description: string; error?: string } {
  try {
    const description = cronstrue.toString(expression);
    return { description };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { description: "", error };
  }
}
