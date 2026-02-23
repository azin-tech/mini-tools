export interface RegexMatch {
  match: string;
  index: number;
  groups: Record<string, string> | null;
}

export interface RegexTestResult {
  valid: boolean;
  matches: RegexMatch[];
  matchCount: number;
  error?: string;
}

export function testRegex(pattern: string, flags: string, input: string): RegexTestResult {
  let regex: RegExp;
  try {
    // Always include the global flag so we can find all matches.
    // Deduplicate in case the caller already passed 'g'.
    const normalizedFlags = flags.includes("g") ? flags : `${flags}g`;
    regex = new RegExp(pattern, normalizedFlags);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { valid: false, matches: [], matchCount: 0, error: message };
  }

  const matches: RegexMatch[] = [];
  let result: RegExpExecArray | null;

  // Reset lastIndex to make sure we start from the beginning.
  regex.lastIndex = 0;

  while ((result = regex.exec(input)) !== null) {
    matches.push({
      match: result[0],
      index: result.index,
      groups: result.groups ? (Object.assign({}, result.groups) as Record<string, string>) : null,
    });

    // Guard against zero-length matches causing an infinite loop.
    if (result[0].length === 0) {
      regex.lastIndex++;
    }
  }

  return { valid: true, matches, matchCount: matches.length };
}
