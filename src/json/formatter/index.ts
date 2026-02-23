export interface FormatJsonOptions {
  indent?: 2 | 4;
  sortKeys?: boolean;
}

export interface FormatJsonResult {
  output: string;
  error?: string;
}

function sortKeysRecursively(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysRecursively);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysRecursively((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function formatJson(input: string, options?: FormatJsonOptions): FormatJsonResult {
  const indent = options?.indent ?? 2;

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    return {
      output: "",
      error: `Invalid JSON: ${message}`,
    };
  }

  const data = options?.sortKeys ? sortKeysRecursively(parsed) : parsed;
  return { output: JSON.stringify(data, null, indent) };
}
