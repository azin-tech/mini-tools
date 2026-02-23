import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { base64Decode, base64Encode } from "../src/base64/index.js";
import { describeCron, generateCron } from "../src/cron-generator/index.js";
import { validateOpenApi } from "../src/openapi-validator/index.js";
import { buildPgConnectionString } from "../src/postgresql-connection-string/index.js";
import type { RobotsRule } from "../src/robots-txt-generator/index.js";
import { generateRobotsTxt } from "../src/robots-txt-generator/index.js";
import { generateUuid } from "../src/uuid-generator/index.js";
import { formatYaml } from "../src/yaml/formatter/index.js";
import { yamlToJson } from "../src/yaml/to-json/index.js";
import { jsonToYaml } from "../src/yaml/to-yaml/index.js";
import { validateYaml } from "../src/yaml/validator/index.js";

// --- helpers ---

function output(data: unknown, jsonFlag: boolean) {
  if (jsonFlag) {
    process.stdout.write(`${JSON.stringify(data)}\n`);
  } else if (typeof data === "string") {
    process.stdout.write(`${data}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  }
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

async function resolveInput(arg: string | undefined): Promise<string | null> {
  if (arg === "-") return readStdin();
  if (arg !== undefined) return arg;
  return null;
}

async function requireInput(arg: string | undefined, hint: string): Promise<string> {
  const input = await resolveInput(arg);
  if (input === null) {
    process.stderr.write(
      `Error: provide input as argument or use - for stdin.\nUsage: mini-tools ${hint} --help\n`
    );
    process.exit(1);
  }
  return input;
}

// --- program ---

const program = new Command();
program
  .name("mini-tools")
  .description(
    "Developer mini-tools: YAML, OpenAPI, Base64, Cron, Robots.txt, PostgreSQL, UUID\n\n" +
      "All commands accept --json for machine-readable output.\n" +
      "Text-input commands accept - as input to read from stdin.\n" +
      "Exit code 1 on validation failures (safe for CI pipelines)."
  )
  .version(pkg.version);

// ─── yaml ───────────────────────────────────────────────────────────────────

const yaml = program.command("yaml").description("YAML utilities (validate, format, convert)");

yaml
  .command("validate [input]")
  .description("Validate YAML. Supports single and multi-document (---) input.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools yaml validate "key: value"
  mini-tools yaml validate "key: [unclosed"
  cat file.yml | mini-tools yaml validate -

JSON output schema:
  { "valid": true,  "errors": [] }
  { "valid": false, "errors": ["unexpected end of stream at line 1"] }

Exit codes: 0 = valid, 1 = invalid or parse error`
  )
  .action(async (inputArg: string | undefined, opts: { json?: boolean }) => {
    const input = await requireInput(inputArg, "yaml validate");
    const result = validateYaml(input);
    if (opts.json) {
      output(result, true);
    } else {
      if (result.valid) {
        process.stdout.write("Valid YAML\n");
      } else {
        process.stderr.write("Invalid YAML:\n");
        for (const e of result.errors) process.stderr.write(`  ${e}\n`);
      }
    }
    if (!result.valid) process.exit(1);
  });

yaml
  .command("format [input]")
  .description("Format YAML to consistent block style. Preserves multi-document (---) input.")
  .option("--indent <n>", "indentation spaces: 2 or 4", "2")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools yaml format "person: {name: ada, age: 30}"
  mini-tools yaml format "list: [1,2,3]" --indent 4
  cat messy.yml | mini-tools yaml format -

JSON output schema:
  { "output": "person:\\n  name: ada\\n  age: 30\\n" }
  { "output": "", "error": "reason the input could not be parsed" }`
  )
  .action(async (inputArg: string | undefined, opts: { indent: string; json?: boolean }) => {
    const input = await requireInput(inputArg, "yaml format");
    const indent = Number(opts.indent) === 4 ? 4 : 2;
    const result = formatYaml(input, { indent });
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(result.output);
    }
    if (result.error) process.exit(1);
  });

yaml
  .command("to-json [input]")
  .description("Convert YAML to pretty-printed JSON.")
  .option("--json", "wrap output in a JSON envelope { output, error? }")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools yaml to-json "name: azin\\nversion: 1"
  cat data.yml | mini-tools yaml to-json -

Output (plain): pretty-printed JSON string printed directly
Output (--json envelope):
  { "output": "{\\n  \\"name\\": \\"azin\\"\\n}" }
  { "output": "", "error": "reason" }`
  )
  .action(async (inputArg: string | undefined, opts: { json?: boolean }) => {
    const input = await requireInput(inputArg, "yaml to-json");
    const result = yamlToJson(input);
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(`${result.output}\n`);
    }
    if (result.error) process.exit(1);
  });

yaml
  .command("to-yaml [input]")
  .description("Convert JSON to YAML.")
  .option("--json", "wrap output in a JSON envelope { output, error? }")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools yaml to-yaml '{"name":"azin","version":1}'
  cat data.json | mini-tools yaml to-yaml -

Output (plain): YAML string printed directly
Output (--json envelope):
  { "output": "name: azin\\nversion: 1\\n" }
  { "output": "", "error": "reason" }`
  )
  .action(async (inputArg: string | undefined, opts: { json?: boolean }) => {
    const input = await requireInput(inputArg, "yaml to-yaml");
    const result = jsonToYaml(input);
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(result.output);
    }
    if (result.error) process.exit(1);
  });

// ─── openapi ─────────────────────────────────────────────────────────────────

const openapi = program
  .command("openapi")
  .description("OpenAPI / Swagger spec utilities");

openapi
  .command("validate [input]")
  .description(
    "Validate an OpenAPI 2.0 (Swagger) or 3.x spec. Accepts YAML or JSON, auto-detected."
  )
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools openapi validate ./openapi.yaml
  cat openapi.json | mini-tools openapi validate -
  mini-tools openapi validate '{"openapi":"3.0.0","info":{"title":"X","version":"1"},"paths":{}}'

JSON output schema:
  {
    "valid": true,
    "version": "3.0.0",        -- "2.0" for Swagger, "3.0.x"/"3.1.x" for OAS
    "errors": [],
    "warnings": []
  }

Exit codes: 0 = valid, 1 = invalid`
  )
  .action(async (inputArg: string | undefined, opts: { json?: boolean }) => {
    const input = await requireInput(inputArg, "openapi validate");
    const result = await validateOpenApi(input);
    if (opts.json) {
      output(result, true);
    } else {
      if (result.valid) {
        process.stdout.write(`Valid OpenAPI spec (version ${result.version ?? "unknown"})\n`);
        if (result.warnings.length > 0) {
          process.stdout.write("Warnings:\n");
          for (const w of result.warnings) process.stdout.write(`  ${w}\n`);
        }
      } else {
        process.stderr.write("Invalid OpenAPI spec:\n");
        for (const e of result.errors) process.stderr.write(`  ${e}\n`);
      }
    }
    if (!result.valid) process.exit(1);
  });

// ─── base64 ──────────────────────────────────────────────────────────────────

const b64 = program
  .command("base64")
  .description("Base64 encode and decode. Handles standard and URL-safe base64 (- and _).");

b64
  .command("encode <input>")
  .description("Base64-encode a UTF-8 string.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools base64 encode "hello world"
  mini-tools base64 encode "hello world" --json

Output (plain): aGVsbG8gd29ybGQ=
JSON output schema: { "output": "aGVsbG8gd29ybGQ=" }`
  )
  .action((inputArg: string, opts: { json?: boolean }) => {
    const result = base64Encode(inputArg);
    if (opts.json) {
      output(result, true);
    } else {
      process.stdout.write(`${result.output}\n`);
    }
  });

b64
  .command("decode <input>")
  .description("Base64-decode a string back to UTF-8. Returns an error if input is invalid.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools base64 decode "aGVsbG8gd29ybGQ="
  mini-tools base64 decode "aGVsbG8gd29ybGQ=" --json

Output (plain): hello world
JSON output schema:
  { "output": "hello world" }
  { "output": "", "error": "Invalid base64 string" }

Exit codes: 0 = success, 1 = invalid base64 input`
  )
  .action((inputArg: string, opts: { json?: boolean }) => {
    const result = base64Decode(inputArg);
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(`${result.output}\n`);
    }
    if (result.error) process.exit(1);
  });

// ─── cron ─────────────────────────────────────────────────────────────────────

const cron = program
  .command("cron")
  .description("Cron expression generator and explainer.");

cron
  .command("generate")
  .description("Build a cron expression from fields or a named preset.")
  .option("--minute <m>", "minute (0-59, or * / */n / ranges)")
  .option("--hour <h>", "hour (0-23, or * / */n / ranges)")
  .option("--day <d>", "day-of-month (1-31, or *)")
  .option("--month <m>", "month (1-12, or *)")
  .option("--weekday <w>", "day-of-week (0=Sun … 6=Sat, or *)")
  .option("--preset <p>", "named preset: hourly | daily | weekly | monthly | yearly")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Presets:
  hourly   →  0 * * * *   (every hour on the hour)
  daily    →  0 0 * * *   (midnight every day)
  weekly   →  0 0 * * 0   (midnight every Sunday)
  monthly  →  0 0 1 * *   (midnight on the 1st)
  yearly   →  0 0 1 1 *   (midnight on Jan 1st)

Examples:
  mini-tools cron generate --preset daily
  mini-tools cron generate --hour 9 --minute 30 --weekday 1
  mini-tools cron generate --minute "*/15"

JSON output schema:
  { "expression": "0 9 * * 1", "description": "At 09:00 AM, only on Monday" }
  { "expression": "bad * *",   "description": "", "error": "reason" }`
  )
  .action(
    (opts: {
      minute?: string;
      hour?: string;
      day?: string;
      month?: string;
      weekday?: string;
      preset?: string;
      json?: boolean;
    }) => {
      const result = generateCron({
        minute: opts.minute,
        hour: opts.hour,
        day: opts.day,
        month: opts.month,
        weekday: opts.weekday,
        preset: opts.preset as Parameters<typeof generateCron>[0]["preset"],
      });
      if (opts.json) {
        output(result, true);
      } else {
        process.stdout.write(`${result.expression}\n${result.description}\n`);
      }
    }
  );

cron
  .command("describe <expression>")
  .description("Explain a cron expression in plain English.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools cron describe "*/15 * * * *"
  mini-tools cron describe "0 9 * * 1-5"
  mini-tools cron describe "0 0 1 * *" --json

JSON output schema:
  { "description": "Every 15 minutes" }
  { "description": "", "error": "reason the expression is invalid" }

Exit codes: 0 = success, 1 = invalid expression`
  )
  .action((expression: string, opts: { json?: boolean }) => {
    const result = describeCron(expression);
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(`${result.description}\n`);
    }
    if (result.error) process.exit(1);
  });

// ─── robots-txt ───────────────────────────────────────────────────────────────

program
  .command("robots-txt [input]")
  .description("Generate a robots.txt file from a JSON array of rules.")
  .option("--file <path>", "read rules from a JSON file instead of argument/stdin")
  .option("--sitemap <url>", "append a Sitemap: directive at the end")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Input format — JSON array of rule objects:
  [
    { "userAgent": "*",         "disallow": ["/admin", "/private"] },
    { "userAgent": "Googlebot", "allow": ["/"], "crawlDelay": 1 }
  ]

Fields per rule:
  userAgent   string    required  "*" or a bot name e.g. "Googlebot"
  allow       string[]  optional  paths to allow (must start with /)
  disallow    string[]  optional  paths to disallow (must start with /)
  crawlDelay  number    optional  seconds between requests

Examples:
  mini-tools robots-txt '[{"userAgent":"*","disallow":["/admin"]}]'
  mini-tools robots-txt '[{"userAgent":"*","disallow":["/admin"]}]' --sitemap https://example.com/sitemap.xml
  cat rules.json | mini-tools robots-txt -
  mini-tools robots-txt --file rules.json --sitemap https://example.com/sitemap.xml

JSON output schema:
  { "output": "User-agent: *\\nDisallow: /admin\\n" }`
  )
  .action(
    async (
      inputArg: string | undefined,
      opts: { file?: string; sitemap?: string; json?: boolean }
    ) => {
      let rulesJson: string;

      if (opts.file) {
        const { readFile } = await import("node:fs/promises");
        try {
          rulesJson = await readFile(opts.file, "utf-8");
        } catch {
          process.stderr.write(`Error: cannot read file "${opts.file}"\n`);
          process.exit(1);
          return; // unreachable — tells TypeScript rulesJson is assigned
        }
      } else if (inputArg === "-") {
        rulesJson = await readStdin();
      } else if (inputArg) {
        rulesJson = inputArg;
      } else {
        process.stderr.write(
          "Error: provide JSON rules as argument, use - for stdin, or use --file <path>\n"
        );
        process.exit(1);
        return; // unreachable — keeps TypeScript control flow sound
      }

      let rules: RobotsRule[];
      try {
        rules = JSON.parse(rulesJson) as RobotsRule[];
      } catch {
        process.stderr.write("Error: invalid JSON for robots rules\n");
        process.exit(1);
        return; // unreachable
      }

      const result = generateRobotsTxt(rules, opts.sitemap);
      if (opts.json) {
        output(result, true);
      } else {
        process.stdout.write(result.output);
      }
    }
  );

// ─── pg ───────────────────────────────────────────────────────────────────────

program
  .command("pg")
  .description(
    "Build a PostgreSQL connection string in URL, JDBC, and DATABASE_URL= formats."
  )
  .requiredOption("--host <host>", "database host")
  .requiredOption("--db <database>", "database name")
  .requiredOption("--user <user>", "database user")
  .option("--port <port>", "port (default: 5432)")
  .option("--password <password>", "database password (special chars are URL-encoded)")
  .option("--ssl", "enable SSL — sets sslmode=require")
  .option("--sslmode <mode>", "explicit SSL mode: disable | require | verify-ca | verify-full")
  .option("--app-name <name>", "application name (application_name / ApplicationName)")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools pg --host localhost --db mydb --user admin
  mini-tools pg --host db.example.com --db prod --user api --password "s3cr3t" --ssl
  mini-tools pg --host localhost --db mydb --user admin --json

JSON output schema:
  {
    "url":  "postgresql://admin:s3cr3t@localhost:5432/mydb?sslmode=require",
    "jdbc": "jdbc:postgresql://localhost:5432/mydb?user=admin&password=s3cr3t&sslmode=require",
    "env":  "DATABASE_URL=\\"postgresql://admin:s3cr3t@localhost:5432/mydb?sslmode=require\\""
  }

Notes:
  - Passwords with special characters (@, /, ?, etc.) are automatically URL-encoded
  - --ssl is shorthand for --sslmode require
  - --sslmode overrides --ssl if both are provided`
  )
  .action(
    (opts: {
      host: string;
      db: string;
      user: string;
      port?: string;
      password?: string;
      ssl?: boolean;
      sslmode?: string;
      appName?: string;
      json?: boolean;
    }) => {
      const result = buildPgConnectionString({
        host: opts.host,
        database: opts.db,
        user: opts.user,
        port: opts.port ? Number(opts.port) : undefined,
        password: opts.password,
        ssl: opts.ssl,
        sslmode: opts.sslmode as Parameters<typeof buildPgConnectionString>[0]["sslmode"],
        applicationName: opts.appName,
      });
      if (opts.json) {
        output(result, true);
      } else {
        process.stdout.write(`URL:  ${result.url}\nJDBC: ${result.jdbc}\n${result.env}\n`);
      }
    }
  );

// ─── uuid ─────────────────────────────────────────────────────────────────────

program
  .command("uuid")
  .description("Generate one or more random UUID v4 values.")
  .option("--count <n>", "number of UUIDs to generate (minimum 1)", "1")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools uuid
  mini-tools uuid --count 5
  mini-tools uuid --count 10 --json

Output (plain): one UUID per line
JSON output schema: { "uuids": ["550e8400-...", "..."] }

UUIDs are v4 (random) generated via crypto.randomUUID().`
  )
  .action((opts: { count: string; json?: boolean }) => {
    const result = generateUuid({ count: Number(opts.count) });
    if (opts.json) {
      output(result, true);
    } else {
      for (const u of result.uuids) process.stdout.write(`${u}\n`);
    }
  });

// ─── run ──────────────────────────────────────────────────────────────────────

program.parse();
