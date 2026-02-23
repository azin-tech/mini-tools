import { resolve } from "node:dns/promises";

export type DnsRecordType = "A" | "AAAA" | "TXT" | "NS" | "CNAME" | "MX";

export interface DnsLookupResult {
  hostname: string;
  type: DnsRecordType;
  records: string[];
  error?: string;
}

export async function dnsLookup(hostname: string, type: DnsRecordType): Promise<DnsLookupResult> {
  try {
    const raw = await resolve(hostname, type);

    // MX records come back as objects { exchange, priority }; flatten to strings.
    // TXT records come back as string[][] (each TXT entry is a string[]).
    // All other types are string[].
    const records: string[] = (raw as unknown[]).map((entry) => {
      if (typeof entry === "string") {
        return entry;
      }
      if (Array.isArray(entry)) {
        // TXT record: string[] → join chunks
        return (entry as string[]).join("");
      }
      if (
        entry !== null &&
        typeof entry === "object" &&
        "exchange" in entry &&
        "priority" in entry
      ) {
        const mx = entry as { exchange: string; priority: number };
        return `${mx.priority} ${mx.exchange}`;
      }
      return String(entry);
    });

    return { hostname, type, records };
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? ((err as NodeJS.ErrnoException).code ?? "DNS_ERROR")
        : "DNS_ERROR";
    return {
      hostname,
      type,
      records: [],
      error: code,
    };
  }
}

export { lookupCname } from "./cname.js";
export { lookupMx } from "./mx.js";
