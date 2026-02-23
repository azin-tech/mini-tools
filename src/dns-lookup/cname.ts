import { resolveCname } from "node:dns/promises";

export interface CnameResult {
  hostname: string;
  cname: string | null;
  error?: string;
}

export async function lookupCname(hostname: string): Promise<CnameResult> {
  try {
    const records = await resolveCname(hostname);
    return {
      hostname,
      cname: records.length > 0 ? records[0] : null,
    };
  } catch (err) {
    const code =
      err instanceof Error && "code" in err
        ? ((err as NodeJS.ErrnoException).code ?? "DNS_ERROR")
        : "DNS_ERROR";
    return {
      hostname,
      cname: null,
      error: code,
    };
  }
}
