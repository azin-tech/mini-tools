# @azin/mini-tools

Developer mini-tools for the terminal and web. Powers [azin.run/tools](https://azin.run/tools).

## Installation

```bash
bun add @azin/mini-tools
# or
npm install @azin/mini-tools
```

## CLI Usage

```bash
# Install globally
bun install -g @azin/mini-tools

# YAML
mini-tools yaml validate "key: value"
mini-tools yaml validate -                          # read from stdin
mini-tools yaml format "key:   value" --indent 2
mini-tools yaml to-json "key: value"
mini-tools yaml to-yaml '{"key":"value"}'

# OpenAPI
mini-tools openapi validate -                       # pipe in a spec
mini-tools openapi validate ./openapi.yaml

# Base64
mini-tools base64 encode "hello world"
mini-tools base64 decode "aGVsbG8gd29ybGQ="

# Cron
mini-tools cron generate --preset daily
mini-tools cron generate --hour 9 --minute 0 --weekday 1
mini-tools cron describe "0 9 * * 1"

# Robots.txt
mini-tools robots-txt --file rules.json
echo '[{"userAgent":"*","disallow":["/admin"]}]' | mini-tools robots-txt -

# PostgreSQL Connection String
mini-tools pg --host localhost --port 5432 --db mydb --user postgres
mini-tools pg --host db.example.com --db prod --user admin --password secret --ssl
mini-tools pg --host localhost --db mydb --user admin --json

# UUID
mini-tools uuid
mini-tools uuid --count 5
mini-tools uuid --count 10 --json
```

## All commands support `--json` for machine-parseable output:

```bash
mini-tools yaml validate "key: value" --json
# {"valid":true,"errors":[]}

mini-tools base64 encode "hello" --json
# {"output":"aGVsbG8="}
```

## Stdin piping (use `-` as input):

```bash
cat schema.yml | mini-tools openapi validate -
cat data.yaml | mini-tools yaml to-json -
echo "aGVsbG8=" | mini-tools base64 decode -
```

---

## Library API

```typescript
import {
  // YAML
  validateYaml, formatYaml, yamlToJson, jsonToYaml,
  // OpenAPI
  validateOpenApi,
  // Base64
  base64Encode, base64Decode, isValidBase64,
  // Cron
  generateCron, describeCron,
  // Robots.txt
  generateRobotsTxt,
  // PostgreSQL
  buildPgConnectionString,
  // UUID
  generateUuid,
} from "@azin/mini-tools"
```

### YAML Validator
```typescript
const result = validateYaml("key: value")
// { valid: true, errors: [] }

const result = validateYaml("key: [unclosed")
// { valid: false, errors: ["unexpected end of the stream within a flow collection at line 1, column 14"] }
```

### YAML Formatter
```typescript
const result = formatYaml("key:   value\nlist: [1,2,3]", { indent: 2 })
// { output: "key: value\nlist:\n  - 1\n  - 2\n  - 3\n" }
```

### YAML → JSON
```typescript
const result = yamlToJson("key: value\nnum: 42")
// { output: '{\n  "key": "value",\n  "num": 42\n}' }
```

### JSON → YAML
```typescript
const result = jsonToYaml('{"key":"value","num":42}')
// { output: "key: value\nnum: 42\n" }
```

### OpenAPI Validator
```typescript
const result = await validateOpenApi(specString)
// { valid: true, version: "3.1.0", errors: [], warnings: [] }
```

### Base64
```typescript
base64Encode("hello world")        // { output: "aGVsbG8gd29ybGQ=" }
base64Decode("aGVsbG8gd29ybGQ=")  // { output: "hello world" }
base64Decode("not-valid!!!")        // { output: "", error: "Invalid base64 string" }
isValidBase64("aGVsbG8=")          // true
```

### Cron Generator
```typescript
generateCron({ preset: "daily" })
// { expression: "0 0 * * *", description: "At 12:00 AM" }

generateCron({ hour: "9", minute: "0", weekday: "1" })
// { expression: "0 9 * * 1", description: "At 09:00 AM, only on Monday" }

describeCron("*/15 * * * *")
// { description: "Every 15 minutes" }
```

### Robots.txt Generator
```typescript
generateRobotsTxt(
  [
    { userAgent: "*", disallow: ["/admin", "/private"] },
    { userAgent: "Googlebot", allow: ["/"], crawlDelay: 1 },
  ],
  "https://example.com/sitemap.xml"
)
// { output: "User-agent: *\nDisallow: /admin\n..." }
```

### PostgreSQL Connection String
```typescript
buildPgConnectionString({
  host: "localhost",
  database: "mydb",
  user: "admin",
  password: "s3cr3t",
  ssl: true,
})
// {
//   url: "postgresql://admin:s3cr3t@localhost:5432/mydb?sslmode=require",
//   jdbc: "jdbc:postgresql://localhost:5432/mydb?user=admin&password=s3cr3t&sslmode=require",
//   env: 'DATABASE_URL="postgresql://admin:s3cr3t@localhost:5432/mydb?sslmode=require"',
// }
```

### UUID Generator
```typescript
generateUuid()             // { uuids: ["550e8400-e29b-41d4-a716-446655440000"] }
generateUuid({ count: 3 }) // { uuids: ["...", "...", "..."] }
```

---

## Tool Index

| Tool | CLI Command | Function | Deps |
|------|-------------|----------|------|
| YAML Validator | `yaml validate` | `validateYaml` | js-yaml |
| YAML Formatter | `yaml format` | `formatYaml` | js-yaml |
| YAML → JSON | `yaml to-json` | `yamlToJson` | js-yaml |
| JSON → YAML | `yaml to-yaml` | `jsonToYaml` | js-yaml |
| OpenAPI Validator | `openapi validate` | `validateOpenApi` | @readme/openapi-parser |
| Base64 Encode/Decode | `base64 encode/decode` | `base64Encode/Decode` | none |
| Cron Generator | `cron generate/describe` | `generateCron/describeCron` | cronstrue |
| Robots.txt Generator | `robots-txt` | `generateRobotsTxt` | none |
| PostgreSQL Conn. String | `pg` | `buildPgConnectionString` | none |
| UUID Generator | `uuid` | `generateUuid` | none |
