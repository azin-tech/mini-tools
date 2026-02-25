# <img src="icon.png" width="32" height="32" alt="" /> @azin-tech/mini-tools

Developer mini-tools for the terminal and web. These tools are also available as a web app at [azin.run/tools](https://azin.run/tools).

## Installation

```bash
bun add @azin-tech/mini-tools
# or
npm install @azin-tech/mini-tools
```

## CLI Usage

```bash
# Install globally
bun install -g @azin-tech/mini-tools
# or
npm install -g @azin-tech/mini-tools

# YAML
mini-tools yaml validate "key: value"
mini-tools yaml validate -                          # read from stdin
mini-tools yaml format "key:   value" --indent 2
mini-tools yaml to-json "key: value"
mini-tools yaml to-yaml '{"key":"value"}'

# OpenAPI
mini-tools openapi validate -                       # pipe in a spec
mini-tools openapi validate ./openapi.yaml

# JSON
mini-tools json validate '{"key":"value"}'
mini-tools json format '{"b":2,"a":1}' --indent 4 --sort-keys

# Base64
mini-tools base64 encode "hello world"
mini-tools base64 decode "aGVsbG8gd29ybGQ="

# Cron
mini-tools cron generate --preset daily
mini-tools cron generate --hour 9 --minute 0 --weekday 1
mini-tools cron describe "0 9 * * 1"

# Regex
mini-tools regex "^\d+" --flags gi "123 abc 456"

# Robots.txt
mini-tools robots-txt --file rules.json
echo '[{"userAgent":"*","disallow":["/admin"]}]' | mini-tools robots-txt -

# PostgreSQL Connection String
mini-tools pg --host localhost --port 5432 --db mydb --user postgres
mini-tools pg --host db.example.com --db prod --user admin --password secret --ssl
mini-tools pg --host localhost --db mydb --user admin --json

# MySQL Connection String
mini-tools mysql --host localhost --db mydb --user root
mini-tools mysql --host db.example.com --db prod --user admin --password secret --ssl

# UUID
mini-tools uuid
mini-tools uuid --count 5

# Uptime Calculator
mini-tools uptime 99.9
mini-tools uptime 99.99 --json

# Dockerfile Generator
mini-tools dockerfile --runtime node
mini-tools dockerfile --runtime python --version 3.12 --port 8000
mini-tools dockerfile --runtime go --port 8080

# JWT Decoder
mini-tools jwt decode <token>

# Hash Generator
mini-tools hash "hello world" --algorithm sha256
mini-tools hash "hello world" --algorithm md5

# Timestamp Converter
mini-tools timestamp 1700000000
mini-tools timestamp "2024-01-15T10:30:00Z"
mini-tools timestamp now

# DNS
mini-tools dns cname docs.example.com
mini-tools dns mx gmail.com
mini-tools dns lookup example.com --type A
mini-tools dns lookup example.com --type TXT
```

## All commands support `--json` for machine-parseable output:

```bash
mini-tools yaml validate "key: value" --json
# {"valid":true,"errors":[]}

mini-tools base64 encode "hello" --json
# {"output":"aGVsbG8="}

mini-tools hash "hello world" --algorithm sha256 --json
# {"hash":"b94d27b9934d3e08a52e52d7da7dabfac484efe04294e576e36b42d7c6f35e8c","algorithm":"sha256"}
```

## Stdin piping (use `-` as input):

```bash
cat schema.yml | mini-tools openapi validate -
cat data.yaml | mini-tools yaml to-json -
echo "aGVsbG8=" | mini-tools base64 decode -
cat file.json | mini-tools json format - --indent 4
```

---

## Library API

```typescript
import {
  // YAML
  validateYaml, formatYaml, yamlToJson, jsonToYaml,
  // OpenAPI
  validateOpenApi,
  // JSON
  validateJson, formatJson,
  // Base64
  base64Encode, base64Decode, isValidBase64,
  // Cron
  generateCron, describeCron,
  // Regex
  testRegex,
  // Robots.txt
  generateRobotsTxt,
  // PostgreSQL
  buildPgConnectionString,
  // MySQL
  buildMysqlConnectionString,
  // UUID
  generateUuid,
  // Uptime
  calculateUptime,
  // Dockerfile
  generateDockerfile,
  // JWT
  decodeJwt,
  // Hash
  generateHash,
  // Timestamp
  convertTimestamp, nowTimestamp,
  // DNS
  dnsLookup, lookupCname, lookupMx,
} from "@azin-tech/mini-tools"
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

### JSON Validator
```typescript
validateJson('{"key":"value"}')   // { valid: true, errors: [] }
validateJson('{bad json}')        // { valid: false, errors: ["Expected property name or '}'..."] }
```

### JSON Formatter
```typescript
formatJson('{"b":2,"a":1}')
// { output: '{\n  "b": 2,\n  "a": 1\n}' }

formatJson('{"b":2,"a":1}', { indent: 4, sortKeys: true })
// { output: '{\n    "a": 1,\n    "b": 2\n}' }

formatJson('{bad}')
// { output: "", error: "Invalid JSON: Expected property name or '}'..." }
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

### Regex Tester
```typescript
testRegex("\\d+", "g", "foo 123 bar 456")
// {
//   valid: true,
//   matches: [
//     { match: "123", index: 4, groups: null },
//     { match: "456", index: 12, groups: null },
//   ],
//   matchCount: 2,
// }

testRegex("(?<word>\\w+)", "g", "hello world")
// matches include groups: { word: "hello" }, { word: "world" }

testRegex("[unclosed", "", "input")
// { valid: false, matches: [], matchCount: 0, error: "Invalid regular expression: ..." }
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

### MySQL Connection String
```typescript
buildMysqlConnectionString({
  host: "localhost",
  database: "mydb",
  user: "root",
  password: "s3cr3t",
  ssl: true,
})
// {
//   url: "mysql://root:s3cr3t@localhost:3306/mydb?ssl=true",
//   jdbc: "jdbc:mysql://localhost:3306/mydb?user=root&password=s3cr3t&useSSL=true",
//   env: 'DATABASE_URL="mysql://root:s3cr3t@localhost:3306/mydb?ssl=true"',
// }
```

### UUID Generator
```typescript
generateUuid()             // { uuids: ["550e8400-e29b-41d4-a716-446655440000"] }
generateUuid({ count: 3 }) // { uuids: ["...", "...", "..."] }
```

### Uptime Calculator
```typescript
calculateUptime(99.9)
// {
//   percentage: 99.9,
//   maxDowntimePerDay: "1m 26s",
//   maxDowntimePerWeek: "10m 4s",
//   maxDowntimePerMonth: "43m 11s",
//   maxDowntimePerYear: "8h 45m 56s",
// }

calculateUptime(150)
// { error: "Percentage must be between 0 and 100" }
```

### Dockerfile Generator
```typescript
generateDockerfile({ runtime: "node" })
// { output: "FROM node:20-alpine\nWORKDIR /app\n..." }

generateDockerfile({ runtime: "python", version: "3.12", port: 8000 })
// { output: "FROM python:3.12-slim\nWORKDIR /app\n..." }

generateDockerfile({ runtime: "go", port: 8080 })
// multi-stage build using golang:1.22-alpine + distroless/static

// Supported runtimes: "node" | "python" | "go" | "rust" | "java" | "static"
// "static" produces a Node build stage + nginx serving stage
```

### JWT Decoder
```typescript
decodeJwt("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwiZXhwIjoxNzAwMDAwMDAwfQ.sig")
// {
//   header: { alg: "HS256", typ: "JWT" },
//   payload: { sub: "1234", exp: 1700000000 },
//   signature: "sig",
//   isExpired: true,
//   expiresAt: "2023-11-14T22:13:20.000Z",
// }

decodeJwt("not.a.token")
// { error: "Invalid JWT: failed to decode header" }

// Note: does NOT verify the signature — for inspection only
```

### Hash Generator
```typescript
generateHash("hello world", "sha256")
// { hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe04294e576e36b42d7c6f35e8c", algorithm: "sha256" }

generateHash("hello world", "md5")
// { hash: "5eb63bbbe01eeed093cb22bb8f5acdc3", algorithm: "md5" }

// Supported algorithms: "md5" | "sha1" | "sha256" | "sha512"
```

### Timestamp Converter
```typescript
convertTimestamp(1700000000)           // unix seconds → all formats
convertTimestamp(1700000000000)        // unix milliseconds → all formats
convertTimestamp("2024-01-15T10:30:00Z")  // ISO string → all formats
// {
//   unix: 1700000000,
//   unixMs: 1700000000000,
//   iso: "2023-11-14T22:13:20.000Z",
//   utc: "Tue, 14 Nov 2023 22:13:20 GMT",
//   local: "11/14/2023, 10:13:20 PM",
//   relative: "14 months ago",
// }

nowTimestamp()   // same shape for the current time
```

### DNS Lookup
```typescript
// Generic lookup (A, AAAA, TXT, NS, CNAME, MX)
await dnsLookup("example.com", "A")
// { hostname: "example.com", type: "A", records: ["93.184.216.34"] }

await dnsLookup("example.com", "TXT")
// { hostname: "example.com", type: "TXT", records: ["v=spf1 ..."] }

// CNAME shorthand
await lookupCname("docs.example.com")
// { hostname: "docs.example.com", type: "CNAME", records: ["example.github.io"] }

// MX shorthand
await lookupMx("gmail.com")
// { hostname: "gmail.com", type: "MX", records: ["5 gmail-smtp-in.l.google.com", ...] }

// DNS error
await dnsLookup("does-not-exist.invalid", "A")
// { hostname: "...", type: "A", records: [], error: "ENOTFOUND" }
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
| JSON Validator | `json validate` | `validateJson` | none |
| JSON Formatter | `json format` | `formatJson` | none |
| Base64 Encode/Decode | `base64 encode/decode` | `base64Encode/Decode` | none |
| Cron Generator | `cron generate/describe` | `generateCron/describeCron` | cronstrue |
| Regex Tester | `regex` | `testRegex` | none |
| Robots.txt Generator | `robots-txt` | `generateRobotsTxt` | none |
| PostgreSQL Conn. String | `pg` | `buildPgConnectionString` | none |
| MySQL Conn. String | `mysql` | `buildMysqlConnectionString` | none |
| UUID Generator | `uuid` | `generateUuid` | none |
| Uptime Calculator | `uptime` | `calculateUptime` | none |
| Dockerfile Generator | `dockerfile` | `generateDockerfile` | none |
| JWT Decoder | `jwt decode` | `decodeJwt` | none |
| Hash Generator | `hash` | `generateHash` | node:crypto |
| Timestamp Converter | `timestamp` | `convertTimestamp/nowTimestamp` | none |
| DNS CNAME Lookup | `dns cname` | `lookupCname` | node:dns |
| DNS MX Lookup | `dns mx` | `lookupMx` | node:dns |
| DNS Generic Lookup | `dns lookup` | `dnsLookup` | node:dns |
