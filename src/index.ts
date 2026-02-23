// Base64
export { base64Decode, base64Encode, isValidBase64 } from "./base64/index.js";

// Cron
export type { CronOptions, CronResult } from "./cron-generator/index.js";
export { describeCron, generateCron, PRESETS } from "./cron-generator/index.js";

// DNS Lookup
export type { CnameResult } from "./dns-lookup/cname.js";
export type { DnsLookupResult, DnsRecordType } from "./dns-lookup/index.js";
export { dnsLookup, lookupCname, lookupMx } from "./dns-lookup/index.js";
export type { MxRecord, MxResult } from "./dns-lookup/mx.js";

// Dockerfile Generator
export type {
  DockerfileOptions,
  DockerfileResult,
  DockerfileRuntime,
} from "./dockerfile-generator/index.js";
export { generateDockerfile } from "./dockerfile-generator/index.js";

// Hash Generator
export type { HashAlgorithm, HashResult } from "./hash-generator/index.js";
export { generateHash } from "./hash-generator/index.js";

// JSON
export type { FormatJsonOptions, FormatJsonResult } from "./json/formatter/index.js";
export { formatJson } from "./json/formatter/index.js";
export type { JsonValidateResult } from "./json/validator/index.js";
export { validateJson } from "./json/validator/index.js";

// JWT Decoder
export type { JwtDecodeResult, JwtPayload } from "./jwt-decoder/index.js";
export { decodeJwt } from "./jwt-decoder/index.js";

// MySQL
export type { MySqlOptions, MySqlResult } from "./mysql-connection-string/index.js";
export { buildMysqlConnectionString } from "./mysql-connection-string/index.js";

// OpenAPI
export type { OpenApiValidateResult } from "./openapi-validator/index.js";
export { validateOpenApi } from "./openapi-validator/index.js";

// PostgreSQL
export type { PgOptions, PgResult } from "./postgresql-connection-string/index.js";
export { buildPgConnectionString } from "./postgresql-connection-string/index.js";

// Regex Tester
export type { RegexMatch, RegexTestResult } from "./regex-tester/index.js";
export { testRegex } from "./regex-tester/index.js";

// Robots.txt
export type { RobotsResult, RobotsRule } from "./robots-txt-generator/index.js";
export { generateRobotsTxt } from "./robots-txt-generator/index.js";

// Timestamp Converter
export type { TimestampResult } from "./timestamp-converter/index.js";
export { convertTimestamp, nowTimestamp } from "./timestamp-converter/index.js";

// Uptime Calculator
export type { UptimeResult } from "./uptime-calculator/index.js";
export { calculateUptime } from "./uptime-calculator/index.js";

// UUID
export { generateUuid } from "./uuid-generator/index.js";

// YAML
export type { YamlFormatOptions, YamlFormatResult } from "./yaml/formatter/index.js";
export { formatYaml } from "./yaml/formatter/index.js";
export type { YamlToJsonResult } from "./yaml/to-json/index.js";
export { yamlToJson } from "./yaml/to-json/index.js";
export type { JsonToYamlResult } from "./yaml/to-yaml/index.js";
export { jsonToYaml } from "./yaml/to-yaml/index.js";
export type { YamlValidateResult } from "./yaml/validator/index.js";
export { validateYaml } from "./yaml/validator/index.js";
