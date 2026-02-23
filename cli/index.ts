import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { base64Decode, base64Encode } from "../src/base64/index.js";
import { describeCron, generateCron } from "../src/cron-generator/index.js";
import { dnsLookup, lookupCname, lookupMx } from "../src/dns-lookup/index.js";
import type { DnsRecordType } from "../src/dns-lookup/index.js";
import { generateDockerfile } from "../src/dockerfile-generator/index.js";
import type { DockerfileRuntime } from "../src/dockerfile-generator/index.js";
import { generateHash } from "../src/hash-generator/index.js";
import type { HashAlgorithm } from "../src/hash-generator/index.js";
import { formatJson } from "../src/json/formatter/index.js";
import { validateJson } from "../src/json/validator/index.js";
import { decodeJwt } from "../src/jwt-decoder/index.js";
import { buildMysqlConnectionString } from "../src/mysql-connection-string/index.js";
import { validateOpenApi } from "../src/openapi-validator/index.js";
import { buildPgConnectionString } from "../src/postgresql-connection-string/index.js";
import { testRegex } from "../src/regex-tester/index.js";
import type { RobotsRule } from "../src/robots-txt-generator/index.js";
import { generateRobotsTxt } from "../src/robots-txt-generator/index.js";
import { convertTimestamp, nowTimestamp } from "../src/timestamp-converter/index.js";
import { calculateUptime } from "../src/uptime-calculator/index.js";
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
    "Developer mini-tools: YAML, OpenAPI, JSON, Base64, Cron, Regex, Robots.txt,\n" +
      "PostgreSQL, MySQL, UUID, Uptime, Dockerfile, JWT, Hash, Timestamp, DNS\n\n" +
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

const openapi = program.command("openapi").description("OpenAPI / Swagger spec utilities");

openapi
  .command("validate [input]")
  .description(
    "Validate an OpenAPI 2.0 (Swagger) or 3.x spec. Accepts YAML or JSON, auto-detected."
  )
  .option("--json", "output JSON")
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

// ─── json ────────────────────────────────────────────────────────────────────

const jsonCmd = program.command("json").description("JSON utilities (validate, format)");

jsonCmd
  .command("validate [input]")
  .description("Validate JSON syntax.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools json validate '{"a":1}'
  echo '{"key":"value"}' | mini-tools json validate -

JSON output schema:
  { "valid": true,  "errors": [] }
  { "valid": false, "errors": ["Unexpected token } in JSON at position 7"] }

Exit codes: 0 = valid, 1 = invalid`
  )
  .action(async (inputArg: string | undefined, opts: { json?: boolean }) => {
    const input = await requireInput(inputArg, "json validate");
    const result = validateJson(input);
    if (opts.json) {
      output(result, true);
    } else {
      if (result.valid) {
        process.stdout.write("Valid JSON\n");
      } else {
        process.stderr.write("Invalid JSON:\n");
        for (const e of result.errors) process.stderr.write(`  ${e}\n`);
      }
    }
    if (!result.valid) process.exit(1);
  });

jsonCmd
  .command("format [input]")
  .description("Pretty-print and format JSON.")
  .option("--indent <n>", "indentation spaces: 2 or 4", "2")
  .option("--sort-keys", "sort object keys alphabetically")
  .option("--json", "wrap output in JSON envelope")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools json format '{"b":2,"a":1}'
  mini-tools json format '{"b":2,"a":1}' --sort-keys
  cat data.json | mini-tools json format - --indent 4

JSON output schema:
  { "output": "{\\"a\\": 1,\\"b\\": 2}" }
  { "output": "", "error": "Invalid JSON: ..." }`
  )
  .action(
    async (
      inputArg: string | undefined,
      opts: { indent: string; sortKeys?: boolean; json?: boolean }
    ) => {
      const input = await requireInput(inputArg, "json format");
      const indent = Number(opts.indent) === 4 ? 4 : 2;
      const result = formatJson(input, { indent, sortKeys: opts.sortKeys });
      if (opts.json) {
        output(result, true);
      } else if (result.error) {
        process.stderr.write(`Error: ${result.error}\n`);
        process.exit(1);
      } else {
        process.stdout.write(`${result.output}\n`);
      }
      if (result.error) process.exit(1);
    }
  );

// ─── base64 ──────────────────────────────────────────────────────────────────

const b64 = program
  .command("base64")
  .description("Base64 encode and decode. Handles standard and URL-safe base64 (- and _).");

b64
  .command("encode <input>")
  .description("Base64-encode a UTF-8 string.")
  .option("--json", "output JSON")
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

const cron = program.command("cron").description("Cron expression generator and explainer.");

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

// ─── regex ────────────────────────────────────────────────────────────────────

program
  .command("regex <pattern> <input>")
  .description("Test a regular expression against an input string.")
  .option("--flags <flags>", "regex flags (e.g. i, g, m, s)", "")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools regex "\\d+" "abc 123 def 456"
  mini-tools regex "\\b\\w+@\\w+\\.\\w+\\b" "email: hi@example.com" --flags gi
  mini-tools regex "(?<year>\\d{4})-(?<month>\\d{2})" "date: 2024-01" --json

JSON output schema:
  { "valid": true, "matchCount": 2, "matches": [{ "match": "123", "index": 4, "groups": null }] }
  { "valid": false, "matchCount": 0, "matches": [], "error": "Invalid regex: ..." }

Exit codes: 0 = success, 1 = invalid regex pattern`
  )
  .action((pattern: string, inputStr: string, opts: { flags: string; json?: boolean }) => {
    const result = testRegex(pattern, opts.flags, inputStr);
    if (opts.json) {
      output(result, true);
    } else if (result.error) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(`${result.matchCount} match(es)\n`);
      for (const m of result.matches) {
        process.stdout.write(`  [${m.index}] "${m.match}"\n`);
        if (m.groups) process.stdout.write(`    groups: ${JSON.stringify(m.groups)}\n`);
      }
    }
    if (!result.valid) process.exit(1);
  });

// ─── robots-txt ───────────────────────────────────────────────────────────────

program
  .command("robots-txt [input]")
  .description("Generate a robots.txt file from a JSON array of rules.")
  .option("--file <path>", "read rules from a JSON file instead of argument/stdin")
  .option("--sitemap <url>", "append a Sitemap: directive at the end")
  .option("--json", "output JSON")
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
          return;
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
        return;
      }

      let rules: RobotsRule[];
      try {
        rules = JSON.parse(rulesJson) as RobotsRule[];
      } catch {
        process.stderr.write("Error: invalid JSON for robots rules\n");
        process.exit(1);
        return;
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
  .description("Build a PostgreSQL connection string in URL, JDBC, and DATABASE_URL= formats.")
  .requiredOption("--host <host>", "database host")
  .requiredOption("--db <database>", "database name")
  .requiredOption("--user <user>", "database user")
  .option("--port <port>", "port (default: 5432)")
  .option("--password <password>", "database password (special chars are URL-encoded)")
  .option("--ssl", "enable SSL — sets sslmode=require")
  .option("--sslmode <mode>", "explicit SSL mode: disable | require | verify-ca | verify-full")
  .option("--app-name <name>", "application name (application_name / ApplicationName)")
  .option("--json", "output JSON")
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

// ─── mysql ────────────────────────────────────────────────────────────────────

program
  .command("mysql")
  .description("Build a MySQL connection string in URL, JDBC, and DATABASE_URL= formats.")
  .requiredOption("--host <host>", "database host")
  .requiredOption("--db <database>", "database name")
  .requiredOption("--user <user>", "database user")
  .option("--port <port>", "port (default: 3306)")
  .option("--password <password>", "database password (special chars are URL-encoded)")
  .option("--ssl", "enable SSL")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools mysql --host localhost --db mydb --user root
  mini-tools mysql --host db.example.com --db prod --user api --password "s3cr3t" --ssl
  mini-tools mysql --host localhost --db mydb --user root --json

JSON output schema:
  {
    "url":  "mysql://root:s3cr3t@localhost:3306/mydb?ssl=true",
    "jdbc": "jdbc:mysql://localhost:3306/mydb?user=root&password=s3cr3t&useSSL=true",
    "env":  "DATABASE_URL=\\"mysql://root:s3cr3t@localhost:3306/mydb?ssl=true\\""
  }`
  )
  .action(
    (opts: {
      host: string;
      db: string;
      user: string;
      port?: string;
      password?: string;
      ssl?: boolean;
      json?: boolean;
    }) => {
      const result = buildMysqlConnectionString({
        host: opts.host,
        database: opts.db,
        user: opts.user,
        port: opts.port ? Number(opts.port) : undefined,
        password: opts.password,
        ssl: opts.ssl,
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
  .action((opts: { count: string; json?: boolean }) => {
    const result = generateUuid({ count: Number(opts.count) });
    if (opts.json) {
      output(result, true);
    } else {
      for (const u of result.uuids) process.stdout.write(`${u}\n`);
    }
  });

// ─── uptime ───────────────────────────────────────────────────────────────────

program
  .command("uptime <percentage>")
  .description(
    "Calculate allowed downtime for a given uptime percentage (e.g. 99.9 for three nines)."
  )
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools uptime 99.9
  mini-tools uptime 99.99 --json

JSON output schema:
  {
    "percentage": 99.9,
    "maxDowntimePerDay": "1m 26s",
    "maxDowntimePerWeek": "10m 4s",
    "maxDowntimePerMonth": "43m 28s",
    "maxDowntimePerYear": "8h 45m 56s"
  }

Exit codes: 0 = success, 1 = invalid percentage`
  )
  .action((percentageStr: string, opts: { json?: boolean }) => {
    const result = calculateUptime(Number(percentageStr));
    if ("error" in result) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    }
    if (opts.json) {
      output(result, true);
    } else {
      process.stdout.write(
        `${result.percentage}% uptime\n` +
          `Per day:   ${result.maxDowntimePerDay}\n` +
          `Per week:  ${result.maxDowntimePerWeek}\n` +
          `Per month: ${result.maxDowntimePerMonth}\n` +
          `Per year:  ${result.maxDowntimePerYear}\n`
      );
    }
  });

// ─── dockerfile ───────────────────────────────────────────────────────────────

program
  .command("dockerfile")
  .description("Generate a production-ready Dockerfile.")
  .requiredOption(
    "--runtime <runtime>",
    "runtime: node | python | go | rust | java | static"
  )
  .option("--version <version>", "runtime version (e.g. 20, 3.11, 1.22)")
  .option("--port <port>", "exposed port (default: 3000)")
  .option("--workdir <dir>", "working directory (default: /app)")
  .option("--install <cmd>", "install command (e.g. 'npm install')")
  .option("--build <cmd>", "build command (e.g. 'npm run build')")
  .option("--start <cmd>", "start command (e.g. 'node dist/index.js')")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools dockerfile --runtime node
  mini-tools dockerfile --runtime node --version 20 --port 8080 --build "npm run build" --start "node dist/index.js"
  mini-tools dockerfile --runtime python --version 3.11 --install "pip install -r requirements.txt"
  mini-tools dockerfile --runtime go --json`
  )
  .action(
    (opts: {
      runtime: string;
      version?: string;
      port?: string;
      workdir?: string;
      install?: string;
      build?: string;
      start?: string;
      json?: boolean;
    }) => {
      const result = generateDockerfile({
        runtime: opts.runtime as DockerfileRuntime,
        version: opts.version,
        port: opts.port ? Number(opts.port) : undefined,
        workdir: opts.workdir,
        installCmd: opts.install,
        buildCmd: opts.build,
        startCmd: opts.start,
      });
      if (opts.json) {
        output(result, true);
      } else {
        process.stdout.write(`${result.output}\n`);
      }
    }
  );

// ─── jwt ──────────────────────────────────────────────────────────────────────

const jwtCmd = program.command("jwt").description("JSON Web Token utilities.");

jwtCmd
  .command("decode <token>")
  .description(
    "Decode a JWT header and payload. Does NOT verify the signature."
  )
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools jwt decode "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.sig"
  mini-tools jwt decode "$TOKEN" --json

JSON output schema:
  {
    "header":    { "alg": "HS256", "typ": "JWT" },
    "payload":   { "sub": "1234", "iat": 1516239022 },
    "signature": "SflKxw...",
    "isExpired": false,
    "expiresAt": "2024-01-20T10:30:00.000Z"
  }

Note: signature is NOT verified. This only decodes the base64url-encoded parts.`
  )
  .action((token: string, opts: { json?: boolean }) => {
    const result = decodeJwt(token);
    if ("error" in result) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    }
    if (opts.json) {
      output(result, true);
    } else {
      process.stdout.write(`Header:\n${JSON.stringify(result.header, null, 2)}\n`);
      process.stdout.write(`\nPayload:\n${JSON.stringify(result.payload, null, 2)}\n`);
      if (result.expiresAt) {
        const expired = result.isExpired ? " (EXPIRED)" : "";
        process.stdout.write(`\nExpires: ${result.expiresAt}${expired}\n`);
      }
    }
  });

// ─── hash ─────────────────────────────────────────────────────────────────────

program
  .command("hash <algorithm> <input>")
  .description("Generate a cryptographic hash. Algorithms: md5 | sha1 | sha256 | sha512.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools hash sha256 "hello world"
  mini-tools hash md5 "hello world"
  mini-tools hash sha512 "password123" --json

JSON output schema:
  { "hash": "b94d27b9...", "algorithm": "sha256" }

Exit codes: 0 = success, 1 = unsupported algorithm`
  )
  .action((algorithm: string, inputStr: string, opts: { json?: boolean }) => {
    const result = generateHash(inputStr, algorithm as HashAlgorithm);
    if ("error" in result) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    }
    if (opts.json) {
      output(result, true);
    } else {
      process.stdout.write(`${result.hash}\n`);
    }
  });

// ─── timestamp ────────────────────────────────────────────────────────────────

program
  .command("timestamp [value]")
  .description(
    "Convert a timestamp. Accepts Unix seconds, Unix ms, or ISO string. Omit value for current time."
  )
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools timestamp
  mini-tools timestamp 1705315800
  mini-tools timestamp 1705315800000
  mini-tools timestamp "2024-01-15T10:30:00Z"
  mini-tools timestamp 1705315800 --json

JSON output schema:
  {
    "unix":     1705315800,
    "unixMs":   1705315800000,
    "iso":      "2024-01-15T10:30:00.000Z",
    "utc":      "Mon, 15 Jan 2024 10:30:00 GMT",
    "local":    "1/15/2024, 10:30:00 AM",
    "relative": "3 days ago"
  }`
  )
  .action((value: string | undefined, opts: { json?: boolean }) => {
    const result = value ? convertTimestamp(value) : nowTimestamp();
    if ("error" in result) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    }
    if (opts.json) {
      output(result, true);
    } else {
      process.stdout.write(
        `Unix:     ${result.unix}\n` +
          `Unix ms:  ${result.unixMs}\n` +
          `ISO:      ${result.iso}\n` +
          `UTC:      ${result.utc}\n` +
          `Relative: ${result.relative}\n`
      );
    }
  });

// ─── dns ──────────────────────────────────────────────────────────────────────

const dns = program.command("dns").description("DNS lookup utilities.");

dns
  .command("cname <hostname>")
  .description("Look up the CNAME record for a hostname.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools dns cname www.github.com
  mini-tools dns cname www.example.com --json

JSON output schema:
  { "hostname": "www.github.com", "cname": "github.com" }
  { "hostname": "example.com",    "cname": null, "error": "ENODATA" }

Exit codes: 0 = success, 1 = DNS error`
  )
  .action(async (hostname: string, opts: { json?: boolean }) => {
    const result = await lookupCname(hostname);
    if (opts.json) {
      output(result, true);
    } else if (result.error && !result.cname) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else {
      process.stdout.write(result.cname ? `${result.cname}\n` : "No CNAME record found\n");
    }
  });

dns
  .command("mx <hostname>")
  .description("Look up MX (mail exchange) records for a hostname, sorted by priority.")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools dns mx gmail.com
  mini-tools dns mx example.com --json

JSON output schema:
  { "hostname": "gmail.com", "records": [{ "priority": 5, "exchange": "gmail-smtp-in.l.google.com" }] }

Records are sorted by priority ascending (lower = higher priority).`
  )
  .action(async (hostname: string, opts: { json?: boolean }) => {
    const result = await lookupMx(hostname);
    if (opts.json) {
      output(result, true);
    } else if (result.error && result.records.length === 0) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else if (result.records.length === 0) {
      process.stdout.write("No MX records found\n");
    } else {
      for (const r of result.records) {
        process.stdout.write(`${r.priority} ${r.exchange}\n`);
      }
    }
  });

dns
  .command("lookup <hostname>")
  .description("Look up any DNS record type for a hostname.")
  .option("--type <type>", "record type: A | AAAA | TXT | NS | CNAME | MX", "A")
  .option("--json", "output JSON")
  .addHelpText(
    "after",
    `
Examples:
  mini-tools dns lookup google.com
  mini-tools dns lookup google.com --type TXT
  mini-tools dns lookup google.com --type MX --json
  mini-tools dns lookup github.com --type NS

JSON output schema:
  { "hostname": "google.com", "type": "A", "records": ["142.250.80.46"] }

Exit codes: 0 = success, 1 = DNS error`
  )
  .action(async (hostname: string, opts: { type: string; json?: boolean }) => {
    const result = await dnsLookup(hostname, opts.type as DnsRecordType);
    if (opts.json) {
      output(result, true);
    } else if (result.error && result.records.length === 0) {
      process.stderr.write(`Error: ${result.error}\n`);
      process.exit(1);
    } else if (result.records.length === 0) {
      process.stdout.write(`No ${opts.type} records found\n`);
    } else {
      for (const r of result.records) process.stdout.write(`${r}\n`);
    }
  });

// ─── run ──────────────────────────────────────────────────────────────────────

program.parse();
