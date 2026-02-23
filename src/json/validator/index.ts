export interface JsonValidateResult {
  valid: boolean;
  errors: string[];
}

export function validateJson(input: string): JsonValidateResult {
  try {
    JSON.parse(input);
    return { valid: true, errors: [] };
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    return { valid: false, errors: [message] };
  }
}
