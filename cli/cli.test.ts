import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import path from "node:path";

const CLI = path.resolve(import.meta.dir, "./index.ts");

function run(args: string[], stdin?: string) {
  const result = spawnSync("bun", ["run", CLI, ...args], {
    input: stdin,
    encoding: "utf-8",
    timeout: 10000,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}

// ─── yaml validate ────────────────────────────────────────────────────────────

describe("yaml validate", () => {
  test("valid YAML → exit 0, human output", () => {
    const r = run(["yaml", "validate", "key: value"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("Valid YAML");
  });

  test("valid YAML → --json", () => {
    const r = run(["yaml", "validate", "key: value", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.valid).toBe(true);
    expect(parsed.errors).toEqual([]);
    expect(r.exitCode).toBe(0);
  });

  test("invalid YAML → exit 1", () => {
    const r = run(["yaml", "validate", "key: [unclosed"]);
    expect(r.exitCode).toBe(1);
  });

  test("valid YAML via stdin", () => {
    const r = run(["yaml", "validate", "-"], "name: test\nvalue: 42\n");
    expect(r.exitCode).toBe(0);
  });
});

// ─── yaml format ─────────────────────────────────────────────────────────────

describe("yaml format", () => {
  test("formats YAML", () => {
    const r = run(["yaml", "format", "list: [1, 2, 3]"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("- 1");
  });

  test("--json flag", () => {
    const r = run(["yaml", "format", "key: value", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.output).toContain("key");
    expect(r.exitCode).toBe(0);
  });
});

// ─── yaml to-json ─────────────────────────────────────────────────────────────

describe("yaml to-json", () => {
  test("converts YAML to JSON", () => {
    const r = run(["yaml", "to-json", "key: value\nnum: 42"]);
    expect(r.exitCode).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.key).toBe("value");
    expect(parsed.num).toBe(42);
  });

  test("invalid YAML → exit 1", () => {
    const r = run(["yaml", "to-json", "key: [unclosed"]);
    expect(r.exitCode).toBe(1);
  });
});

// ─── yaml to-yaml ─────────────────────────────────────────────────────────────

describe("yaml to-yaml", () => {
  test("converts JSON to YAML", () => {
    const r = run(["yaml", "to-yaml", '{"key":"value","num":42}']);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("key: value");
    expect(r.stdout).toContain("num: 42");
  });

  test("invalid JSON → exit 1", () => {
    const r = run(["yaml", "to-yaml", "{not json}"]);
    expect(r.exitCode).toBe(1);
  });
});

// ─── openapi validate ─────────────────────────────────────────────────────────

describe("openapi validate", () => {
  const validSpec = JSON.stringify({
    openapi: "3.0.0",
    info: { title: "Test", version: "1.0.0" },
    paths: {},
  });

  test("valid spec → exit 0", () => {
    const r = run(["openapi", "validate", "-"], validSpec);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("3.0.0");
  });

  test("valid spec → --json", () => {
    const r = run(["openapi", "validate", "-", "--json"], validSpec);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.valid).toBe(true);
    expect(parsed.version).toBe("3.0.0");
    expect(r.exitCode).toBe(0);
  });

  test("invalid spec → exit 1", () => {
    const r = run(["openapi", "validate", '{"not":"a spec"}']);
    expect(r.exitCode).toBe(1);
  });
});

// ─── base64 ──────────────────────────────────────────────────────────────────

describe("base64", () => {
  test("encode", () => {
    const r = run(["base64", "encode", "hello world"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("aGVsbG8gd29ybGQ=");
  });

  test("decode", () => {
    const r = run(["base64", "decode", "aGVsbG8gd29ybGQ="]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toBe("hello world");
  });

  test("encode → --json", () => {
    const r = run(["base64", "encode", "hi", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.output).toBe("aGk=");
    expect(r.exitCode).toBe(0);
  });

  test("decode invalid → exit 1", () => {
    const r = run(["base64", "decode", "not!!!valid"]);
    expect(r.exitCode).toBe(1);
  });
});

// ─── cron ─────────────────────────────────────────────────────────────────────

describe("cron generate", () => {
  test("preset daily", () => {
    const r = run(["cron", "generate", "--preset", "daily"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("0 0 * * *");
  });

  test("preset daily → --json", () => {
    const r = run(["cron", "generate", "--preset", "daily", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.expression).toBe("0 0 * * *");
    expect(parsed.description).toBeTruthy();
    expect(r.exitCode).toBe(0);
  });

  test("custom fields", () => {
    const r = run(["cron", "generate", "--hour", "9", "--minute", "30", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.expression).toBe("30 9 * * *");
  });
});

describe("cron describe", () => {
  test("describes expression", () => {
    const r = run(["cron", "describe", "*/15 * * * *"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.toLowerCase()).toContain("15");
  });

  test("invalid expression → exit 1", () => {
    const r = run(["cron", "describe", "not a cron"]);
    expect(r.exitCode).toBe(1);
  });
});

// ─── robots-txt ───────────────────────────────────────────────────────────────

describe("robots-txt", () => {
  const rules = JSON.stringify([{ userAgent: "*", disallow: ["/admin"] }]);

  test("generates robots.txt from argument", () => {
    const r = run(["robots-txt", rules]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("User-agent: *");
    expect(r.stdout).toContain("Disallow: /admin");
  });

  test("generates robots.txt via stdin", () => {
    const r = run(["robots-txt", "-"], rules);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("Disallow: /admin");
  });

  test("--json output", () => {
    const r = run(["robots-txt", rules, "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.output).toContain("User-agent: *");
    expect(r.exitCode).toBe(0);
  });

  test("--sitemap flag", () => {
    const r = run(["robots-txt", rules, "--sitemap", "https://example.com/sitemap.xml"]);
    expect(r.stdout).toContain("Sitemap: https://example.com/sitemap.xml");
  });
});

// ─── pg ───────────────────────────────────────────────────────────────────────

describe("pg", () => {
  test("basic connection string", () => {
    const r = run(["pg", "--host", "localhost", "--db", "mydb", "--user", "admin"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain("postgresql://");
    expect(r.stdout).toContain("localhost");
    expect(r.stdout).toContain("mydb");
  });

  test("--json output", () => {
    const r = run(["pg", "--host", "localhost", "--db", "mydb", "--user", "admin", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.url).toContain("postgresql://");
    expect(parsed.jdbc).toContain("jdbc:postgresql://");
    expect(parsed.env).toContain("DATABASE_URL=");
    expect(r.exitCode).toBe(0);
  });

  test("--ssl flag adds sslmode=require", () => {
    const r = run([
      "pg",
      "--host",
      "db.example.com",
      "--db",
      "prod",
      "--user",
      "admin",
      "--ssl",
      "--json",
    ]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.url).toContain("sslmode=require");
  });
});

// ─── uuid ─────────────────────────────────────────────────────────────────────

describe("uuid", () => {
  test("generates 1 UUID by default", () => {
    const r = run(["uuid"]);
    expect(r.exitCode).toBe(0);
    expect(r.stdout.trim()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  test("--count 5 generates 5 UUIDs", () => {
    const r = run(["uuid", "--count", "5"]);
    expect(r.exitCode).toBe(0);
    const lines = r.stdout.trim().split("\n");
    expect(lines).toHaveLength(5);
  });

  test("--json output", () => {
    const r = run(["uuid", "--count", "3", "--json"]);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.uuids).toHaveLength(3);
    expect(r.exitCode).toBe(0);
  });
});
