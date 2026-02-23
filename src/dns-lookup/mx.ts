import { resolveMx } from "node:dns/promises";

export interface MxRecord {
  exchange: string;
  priority: number;
}

export interface MxResult {
  hostname: string;
  records: MxRecord[];
  error?: string;
}

export async function lookupMx(hostname: string): Promise<MxResult> {
  try {
    const raw = await resolveMx(hostname);
    const records = raw
      .map((r) => ({ exchange: r.exchange, priority: r.priority }))
      .sort((a, b) => a.priority - b.priority);
    return { hostname, records };
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? ((err as NodeJS.ErrnoException).code ?? "DNS_ERROR")
        : "DNS_ERROR";
    return {
      hostname,
      records: [],
      error: code,
    };
  }
}
