import {
  base64Decode,
  base64Encode,
  buildPgConnectionString,
  describeCron,
  formatYaml,
  generateCron,
  generateRobotsTxt,
  generateUuid,
  jsonToYaml,
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
    case "/api/yaml/validate":
      return json(res, validateYaml(body.input ?? ""));

    case "/api/yaml/format":
      return json(res, formatYaml(body.input ?? "", { indent: body.indent === "4" ? 4 : 2 }));

    case "/api/yaml/to-json":
      return json(res, yamlToJson(body.input ?? ""));

    case "/api/yaml/to-yaml":
      return json(res, jsonToYaml(body.input ?? ""));

    case "/api/openapi/validate":
      return json(res, await validateOpenApi(body.input ?? ""));

    case "/api/base64/encode":
      return json(res, base64Encode(body.input ?? ""));

    case "/api/base64/decode":
      return json(res, base64Decode(body.input ?? ""));

    case "/api/cron/generate":
      return json(res, generateCron({ preset: body.preset || undefined, hour: body.hour, minute: body.minute, weekday: body.weekday }));

    case "/api/cron/describe":
      return json(res, describeCron(body.expression ?? ""));

    case "/api/robots-txt": {
      try {
        const rules = JSON.parse(body.rules ?? "[]");
        return json(res, generateRobotsTxt(rules, body.sitemapUrl || undefined));
      } catch {
        return json(res, { error: "Invalid JSON in rules field" });
      }
    }

    case "/api/pg":
      return json(res, buildPgConnectionString({
        host: body.host ?? "localhost",
        port: body.port ? Number(body.port) : undefined,
        database: body.database ?? "",
        user: body.user ?? "",
        password: body.password || undefined,
        ssl: body.ssl === "true",
      }));

    case "/api/uuid":
      return json(res, generateUuid({ count: body.count ? Number(body.count) : 1 }));

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
