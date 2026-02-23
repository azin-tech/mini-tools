export interface MySqlOptions {
  host: string;
  port?: number; // default 3306
  database: string;
  user: string;
  password?: string;
  ssl?: boolean;
}

export interface MySqlResult {
  url: string; // mysql://user:pass@host:3306/db?ssl=true
  jdbc: string; // jdbc:mysql://host:3306/db?user=user&password=pass&useSSL=true
  env: string; // DATABASE_URL="mysql://..."
}

export function buildMysqlConnectionString(options: MySqlOptions): MySqlResult {
  const port = options.port ?? 3306;

  // --- URL format ---
  const userInfo = options.password
    ? `${options.user}:${encodeURIComponent(options.password)}`
    : options.user;

  const urlParams = new URLSearchParams();
  if (options.ssl === true) {
    urlParams.set("ssl", "true");
  }

  const urlParamStr = urlParams.toString();
  const url = `mysql://${userInfo}@${options.host}:${port}/${options.database}${urlParamStr ? `?${urlParamStr}` : ""}`;

  // --- JDBC format ---
  const jdbcParams = new URLSearchParams();
  jdbcParams.set("user", options.user);
  if (options.password) {
    jdbcParams.set("password", options.password);
  }
  if (options.ssl === true) {
    jdbcParams.set("useSSL", "true");
  }

  const jdbc = `jdbc:mysql://${options.host}:${port}/${options.database}?${jdbcParams.toString()}`;

  // --- env format ---
  const env = `DATABASE_URL="${url}"`;

  return { url, jdbc, env };
}
