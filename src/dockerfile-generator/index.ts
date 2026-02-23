export type DockerfileRuntime = "node" | "python" | "go" | "rust" | "java" | "static";

export interface DockerfileOptions {
  runtime: DockerfileRuntime;
  /** e.g. "20", "3.11", "1.21" */
  version?: string;
  /** default 3000 */
  port?: number;
  /** default /app */
  workdir?: string;
  /** e.g. "npm install", "pip install -r requirements.txt" */
  installCmd?: string;
  /** e.g. "npm run build" */
  buildCmd?: string;
  /** e.g. "node dist/index.js" */
  startCmd?: string;
}

export interface DockerfileResult {
  output: string;
}

const DEFAULT_VERSIONS: Record<DockerfileRuntime, string> = {
  node: "20",
  python: "3.11",
  go: "1.22",
  rust: "1.75",
  java: "21",
  static: "latest",
};

function buildNodeDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [];

  if (opts.buildCmd) {
    // Multi-stage: build stage
    lines.push(`FROM node:${opts.version}-alpine AS builder`);
    lines.push(`WORKDIR ${opts.workdir}`);
    lines.push("COPY package*.json ./");
    lines.push(`RUN ${opts.installCmd}`);
    lines.push("COPY . .");
    lines.push(`RUN ${opts.buildCmd}`);
    lines.push("");
    // Production stage
    lines.push(`FROM node:${opts.version}-alpine AS runner`);
    lines.push(`WORKDIR ${opts.workdir}`);
    lines.push("COPY package*.json ./");
    lines.push(`RUN ${opts.installCmd} --omit=dev`);
    lines.push(`COPY --from=builder ${opts.workdir} .`);
  } else {
    lines.push(`FROM node:${opts.version}-alpine`);
    lines.push(`WORKDIR ${opts.workdir}`);
    lines.push("COPY package*.json ./");
    lines.push(`RUN ${opts.installCmd}`);
    lines.push("COPY . .");
  }

  lines.push(`EXPOSE ${opts.port}`);
  lines.push(`CMD ["sh", "-c", "${opts.startCmd}"]`);

  return lines.join("\n");
}

function buildPythonDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [
    `FROM python:${opts.version}-slim`,
    `WORKDIR ${opts.workdir}`,
    "COPY requirements.txt ./",
    `RUN ${opts.installCmd}`,
    "COPY . .",
    `EXPOSE ${opts.port}`,
    `CMD ["sh", "-c", "${opts.startCmd}"]`,
  ];
  return lines.join("\n");
}

function buildGoDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [
    `FROM golang:${opts.version}-alpine AS builder`,
    `WORKDIR ${opts.workdir}`,
    "COPY go.mod go.sum ./",
    "RUN go mod download",
    "COPY . .",
    `RUN ${opts.buildCmd}`,
    "",
    "FROM gcr.io/distroless/static AS runner",
    `WORKDIR ${opts.workdir}`,
    `COPY --from=builder ${opts.workdir}/app .`,
    `EXPOSE ${opts.port}`,
    `CMD ["./app"]`,
  ];
  return lines.join("\n");
}

function buildRustDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [
    `FROM rust:${opts.version}-slim AS builder`,
    `WORKDIR ${opts.workdir}`,
    "COPY Cargo.toml Cargo.lock ./",
    "COPY src ./src",
    `RUN ${opts.buildCmd}`,
    "",
    "FROM gcr.io/distroless/cc AS runner",
    `WORKDIR ${opts.workdir}`,
    `COPY --from=builder ${opts.workdir}/target/release/app .`,
    `EXPOSE ${opts.port}`,
    `CMD ["./app"]`,
  ];
  return lines.join("\n");
}

function buildJavaDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [
    `FROM eclipse-temurin:${opts.version}-jdk AS builder`,
    `WORKDIR ${opts.workdir}`,
    "COPY . .",
    `RUN ${opts.buildCmd}`,
    "",
    `FROM eclipse-temurin:${opts.version}-jre AS runner`,
    `WORKDIR ${opts.workdir}`,
    `COPY --from=builder ${opts.workdir}/target/*.jar app.jar`,
    `EXPOSE ${opts.port}`,
    `CMD ["java", "-jar", "app.jar"]`,
  ];
  return lines.join("\n");
}

function buildStaticDockerfile(opts: Required<DockerfileOptions>): string {
  const lines: string[] = [
    "FROM node:20-alpine AS builder",
    `WORKDIR ${opts.workdir}`,
    "COPY package*.json ./",
    `RUN ${opts.installCmd}`,
    "COPY . .",
    `RUN ${opts.buildCmd}`,
    "",
    "FROM nginx:alpine AS runner",
    `COPY --from=builder ${opts.workdir}/dist /usr/share/nginx/html`,
    `EXPOSE ${opts.port}`,
    `CMD ["nginx", "-g", "daemon off;"]`,
  ];
  return lines.join("\n");
}

/**
 * Generate a production-ready multi-stage Dockerfile for the given runtime.
 *
 * @param options - Dockerfile generation options
 * @returns DockerfileResult with the full Dockerfile content
 */
export function generateDockerfile(options: DockerfileOptions): DockerfileResult {
  const runtime = options.runtime;
  const version = options.version ?? DEFAULT_VERSIONS[runtime];
  const port = options.port ?? 3000;
  const workdir = options.workdir ?? "/app";

  const defaults: Record<
    DockerfileRuntime,
    { installCmd: string; buildCmd: string; startCmd: string }
  > = {
    node: {
      installCmd: "npm install",
      buildCmd: "npm run build",
      startCmd: "node dist/index.js",
    },
    python: {
      installCmd: "pip install --no-cache-dir -r requirements.txt",
      buildCmd: "",
      startCmd: "python main.py",
    },
    go: {
      installCmd: "go mod download",
      buildCmd: "go build -o app .",
      startCmd: "./app",
    },
    rust: {
      installCmd: "cargo fetch",
      buildCmd: "cargo build --release",
      startCmd: "./app",
    },
    java: {
      installCmd: "mvn dependency:go-offline",
      buildCmd: "mvn package -DskipTests",
      startCmd: "java -jar app.jar",
    },
    static: {
      installCmd: "npm install",
      buildCmd: "npm run build",
      startCmd: "nginx -g 'daemon off;'",
    },
  };

  const resolved: Required<DockerfileOptions> = {
    runtime,
    version,
    port,
    workdir,
    installCmd: options.installCmd ?? defaults[runtime].installCmd,
    buildCmd: options.buildCmd ?? defaults[runtime].buildCmd,
    startCmd: options.startCmd ?? defaults[runtime].startCmd,
  };

  let output: string;
  switch (runtime) {
    case "node":
      output = buildNodeDockerfile(resolved);
      break;
    case "python":
      output = buildPythonDockerfile(resolved);
      break;
    case "go":
      output = buildGoDockerfile(resolved);
      break;
    case "rust":
      output = buildRustDockerfile(resolved);
      break;
    case "java":
      output = buildJavaDockerfile(resolved);
      break;
    case "static":
      output = buildStaticDockerfile(resolved);
      break;
  }

  return { output };
}
