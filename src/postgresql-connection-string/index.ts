export interface PgOptions {
  host: string;
  port?: number; // default 5432
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
  sslmode?: "disable" | "require" | "verify-ca" | "verify-full";
  applicationName?: string;
}

export interface PgResult {
  url: string; // postgresql://user:pass@host:5432/db?sslmode=require
  jdbc: string; // jdbc:postgresql://host:5432/db?user=...&password=...
  env: string; // DATABASE_URL="postgresql://..."
}

export function buildPgConnectionString(options: PgOptions): PgResult {
  const port = options.port ?? 5432;

  // Resolve sslmode: explicit sslmode wins; ssl=true without sslmode defaults to require
  let resolvedSslMode: string | undefined = options.sslmode;
  if (!resolvedSslMode && options.ssl === true) {
    resolvedSslMode = "require";
  }

  // --- URL format ---
  const userInfo = options.password
    ? `${options.user}:${encodeURIComponent(options.password)}`
    : options.user;

  const urlParams = new URLSearchParams();
  if (resolvedSslMode) {
    urlParams.set("sslmode", resolvedSslMode);
  }
  if (options.applicationName) {
    urlParams.set("application_name", options.applicationName);
  }

  const urlParamStr = urlParams.toString();
  const url = `postgresql://${userInfo}@${options.host}:${port}/${options.database}${urlParamStr ? `?${urlParamStr}` : ""}`;

  // --- JDBC format ---
  const jdbcParams = new URLSearchParams();
  jdbcParams.set("user", options.user);
  if (options.password) {
    jdbcParams.set("password", options.password);
  }
  if (resolvedSslMode) {
    jdbcParams.set("sslmode", resolvedSslMode);
  }
  if (options.applicationName) {
    jdbcParams.set("ApplicationName", options.applicationName);
  }

  const jdbc = `jdbc:postgresql://${options.host}:${port}/${options.database}?${jdbcParams.toString()}`;

  // --- env format ---
  const env = `DATABASE_URL="${url}"`;

  return { url, jdbc, env };
}
