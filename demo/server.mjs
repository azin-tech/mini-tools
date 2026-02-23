import {
  base64Decode,
  base64Encode,
  buildMysqlConnectionString,
  buildPgConnectionString,
  calculateUptime,
  convertTimestamp,
  decodeJwt,
  describeCron,
  dnsLookup,
  formatJson,
  formatYaml,
  generateCron,
  generateDockerfile,
  generateHash,
  generateRobotsTxt,
  generateUuid,
  jsonToYaml,
  lookupCname,
  lookupMx,
  nowTimestamp,
  testRegex,
  validateJson,
  validateOpenApi,
  validateYaml,
  yamlToJson,
} from "@azin-tech/mini-tools";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = readFileSync(join(__dirname, "index.html"), "utf8");
const PORT = 4000;

const json = (res, data, status = 200) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

async function handleApi(path, body, res) {
  switch (path) {
    // ─── YAML ─────────────────────────────────────────────────────────────────
    case "/api/yaml/validate":
      return json(res, validateYaml(body.input ?? ""));

    case "/api/yaml/format":
      return json(res, formatYaml(body.input ?? "", { indent: body.indent === "4" ? 4 : 2 }));

    case "/api/yaml/to-json":
      return json(res, yamlToJson(body.input ?? ""));

    case "/api/yaml/to-yaml":
      return json(res, jsonToYaml(body.input ?? ""));

    // ─── OpenAPI ──────────────────────────────────────────────────────────────
    case "/api/openapi/validate":
      return json(res, await validateOpenApi(body.input ?? ""));

    // ─── JSON ─────────────────────────────────────────────────────────────────
    case "/api/json/validate":
      return json(res, validateJson(body.input ?? ""));

    case "/api/json/format":
      return json(res, formatJson(body.input ?? "", {
        indent: body.indent === "4" ? 4 : 2,
        sortKeys: body.sortKeys === "true",
      }));

    // ─── Base64 ───────────────────────────────────────────────────────────────
    case "/api/base64/encode":
      return json(res, base64Encode(body.input ?? ""));

    case "/api/base64/decode":
      return json(res, base64Decode(body.input ?? ""));

    // ─── Cron ─────────────────────────────────────────────────────────────────
    case "/api/cron/generate":
      return json(res, generateCron({ preset: body.preset || undefined, hour: body.hour, minute: body.minute, weekday: body.weekday }));

    case "/api/cron/describe":
      return json(res, describeCron(body.expression ?? ""));

    // ─── Robots.txt ───────────────────────────────────────────────────────────
    case "/api/robots-txt": {
      try {
        const rules = JSON.parse(body.rules ?? "[]");
        return json(res, generateRobotsTxt(rules, body.sitemapUrl || undefined));
      } catch {
        return json(res, { error: "Invalid JSON in rules field" });
      }
    }

    // ─── UUID ─────────────────────────────────────────────────────────────────
    case "/api/uuid":
      return json(res, generateUuid({ count: body.count ? Number(body.count) : 1 }));

    // ─── Uptime ───────────────────────────────────────────────────────────────
    case "/api/uptime":
      return json(res, calculateUptime(Number(body.percentage ?? "99.9")));

    // ─── Dockerfile ───────────────────────────────────────────────────────────
    case "/api/dockerfile":
      return json(res, generateDockerfile({
        runtime: body.runtime ?? "node",
        version: body.version || undefined,
        port: body.port ? Number(body.port) : undefined,
        workdir: body.workdir || undefined,
        installCmd: body.installCmd || undefined,
        buildCmd: body.buildCmd || undefined,
        startCmd: body.startCmd || undefined,
      }));

    // ─── Timestamp ────────────────────────────────────────────────────────────
    case "/api/timestamp": {
      const val = body.value;
      if (!val || val.trim() === "") return json(res, nowTimestamp());
      const numVal = Number(val);
      const input = !isNaN(numVal) && val.trim() !== "" ? numVal : val;
      return json(res, convertTimestamp(input));
    }

    // ─── Regex ────────────────────────────────────────────────────────────────
    case "/api/regex/test":
      return json(res, testRegex(body.pattern ?? "", body.flags ?? "", body.input ?? ""));

    // ─── Database ─────────────────────────────────────────────────────────────
    case "/api/pg":
      return json(res, buildPgConnectionString({
        host: body.host ?? "localhost",
        port: body.port ? Number(body.port) : undefined,
        database: body.database ?? "",
        user: body.user ?? "",
        password: body.password || undefined,
        ssl: body.ssl === "true",
      }));

    case "/api/mysql":
      return json(res, buildMysqlConnectionString({
        host: body.host ?? "localhost",
        port: body.port ? Number(body.port) : undefined,
        database: body.database ?? "",
        user: body.user ?? "",
        password: body.password || undefined,
        ssl: body.ssl === "true",
      }));

    // ─── Security ─────────────────────────────────────────────────────────────
    case "/api/hash":
      return json(res, generateHash(body.input ?? "", body.algorithm ?? "sha256"));

    case "/api/jwt/decode":
      return json(res, decodeJwt(body.token ?? ""));

    // ─── DNS ──────────────────────────────────────────────────────────────────
    case "/api/dns/cname":
      return json(res, await lookupCname(body.hostname ?? ""));

    case "/api/dns/mx":
      return json(res, await lookupMx(body.hostname ?? ""));

    case "/api/dns/lookup":
      return json(res, await dnsLookup(body.hostname ?? "", body.type ?? "A"));

    default:
      return json(res, { error: "Unknown endpoint" }, 404);
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(HTML);
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    let raw = "";
    req.on("data", chunk => (raw += chunk));
    req.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      await handleApi(url.pathname, body, res);
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
}).listen(PORT, () => {
  console.log(`mini-tools demo → http://localhost:${PORT}`);
});
