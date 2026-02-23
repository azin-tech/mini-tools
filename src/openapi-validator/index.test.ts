import { describe, expect, it } from "bun:test";
import { validateOpenApi } from "./index";

const OAS3_VALID_JSON = JSON.stringify({
  openapi: "3.0.0",
  info: { title: "Test API", version: "1.0.0" },
  paths: {},
});

const OAS3_VALID_YAML = `
openapi: "3.0.0"
info:
  title: Test API
  version: "1.0.0"
paths: {}
`;

const SWAGGER2_VALID_JSON = JSON.stringify({
  swagger: "2.0",
  info: { title: "Test API", version: "1.0.0" },
  host: "example.com",
  paths: {},
});

describe("validateOpenApi", () => {
  it("validates a valid OAS 3.0 spec provided as JSON", async () => {
    const result = await validateOpenApi(OAS3_VALID_JSON);
    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.0.0");
    expect(result.errors).toHaveLength(0);
  });

  it("validates a valid OAS 3.0 spec provided as YAML", async () => {
    const result = await validateOpenApi(OAS3_VALID_YAML);
    expect(result.valid).toBe(true);
    expect(result.version).toBe("3.0.0");
    expect(result.errors).toHaveLength(0);
  });

  it("validates a valid Swagger 2.0 spec", async () => {
    const result = await validateOpenApi(SWAGGER2_VALID_JSON);
    expect(result.valid).toBe(true);
    expect(result.version).toBe("2.0");
    expect(result.errors).toHaveLength(0);
  });

  it("returns invalid with errors for a spec missing required fields", async () => {
    const invalid = JSON.stringify({ openapi: "3.0.0" });
    const result = await validateOpenApi(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns invalid with an error for a completely invalid JSON/YAML string", async () => {
    const result = await validateOpenApi("{this is not valid json or yaml :");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
