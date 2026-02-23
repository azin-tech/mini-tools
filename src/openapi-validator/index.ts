import { validate } from "@readme/openapi-parser";
import * as yaml from "js-yaml";

export interface OpenApiValidateResult {
  valid: boolean;
  version?: string;
  errors: string[];
  warnings: string[];
}

export async function validateOpenApi(input: string): Promise<OpenApiValidateResult> {
  let parsed: unknown;

  // Auto-detect YAML or JSON — try yaml.load first, which also handles JSON
  try {
    parsed = yaml.load(input);
  } catch {
    try {
      parsed = JSON.parse(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        errors: [`Failed to parse input as YAML or JSON: ${message}`],
        warnings: [],
      };
    }
  }

  if (parsed === null || typeof parsed !== "object") {
    return { valid: false, errors: ["Input does not represent an OpenAPI object"], warnings: [] };
  }

  // Extract version before validation (parse may mutate or throw)
  const specObj = parsed as Record<string, unknown>;
  const version =
    (specObj.openapi as string | undefined) ?? (specObj.swagger as string | undefined);

  try {
    // parse() resolves $refs but does not validate — used to get normalized spec
    // validate() performs full schema + semantic validation
    const result = await validate(parsed as Parameters<typeof validate>[0]);

    const warningMessages = result.warnings.map((w) => w.message);

    if (!result.valid) {
      const errorMessages = result.errors.map((e) => e.message);
      return {
        valid: false,
        version,
        errors: errorMessages,
        warnings: warningMessages,
      };
    }

    return {
      valid: true,
      version,
      errors: [],
      warnings: warningMessages,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      valid: false,
      version,
      errors: [message],
      warnings: [],
    };
  }
}
