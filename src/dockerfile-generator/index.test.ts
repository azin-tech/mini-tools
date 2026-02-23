import { describe, expect, it } from "bun:test";
import { generateDockerfile } from "./index";

describe("generateDockerfile - node", () => {
  it("generates a Dockerfile for node runtime with defaults", () => {
    const result = generateDockerfile({ runtime: "node" });
    expect(result.output).toContain("FROM node:20-alpine");
    expect(result.output).toContain("WORKDIR /app");
    expect(result.output).toContain("npm install");
    expect(result.output).toContain("EXPOSE 3000");
  });

  it("uses custom version for node", () => {
    const result = generateDockerfile({ runtime: "node", version: "18" });
    expect(result.output).toContain("FROM node:18-alpine");
  });

  it("uses custom port", () => {
    const result = generateDockerfile({ runtime: "node", port: 8080 });
    expect(result.output).toContain("EXPOSE 8080");
  });

  it("uses custom workdir", () => {
    const result = generateDockerfile({ runtime: "node", workdir: "/srv" });
    expect(result.output).toContain("WORKDIR /srv");
  });

  it("generates multi-stage build when buildCmd is provided", () => {
    const result = generateDockerfile({
      runtime: "node",
      buildCmd: "npm run build",
    });
    expect(result.output).toContain("AS builder");
    expect(result.output).toContain("AS runner");
    expect(result.output).toContain("npm run build");
  });

  it("uses custom startCmd", () => {
    const result = generateDockerfile({
      runtime: "node",
      startCmd: "node server.js",
    });
    expect(result.output).toContain("node server.js");
  });

  it("uses custom installCmd", () => {
    const result = generateDockerfile({
      runtime: "node",
      installCmd: "yarn install --frozen-lockfile",
    });
    expect(result.output).toContain("yarn install --frozen-lockfile");
  });
});

describe("generateDockerfile - python", () => {
  it("generates a Dockerfile for python with defaults", () => {
    const result = generateDockerfile({ runtime: "python" });
    expect(result.output).toContain("FROM python:3.11-slim");
    expect(result.output).toContain("pip install");
    expect(result.output).toContain("EXPOSE 3000");
  });

  it("uses custom python version", () => {
    const result = generateDockerfile({ runtime: "python", version: "3.12" });
    expect(result.output).toContain("FROM python:3.12-slim");
  });
});

describe("generateDockerfile - go", () => {
  it("generates a multi-stage Dockerfile for go", () => {
    const result = generateDockerfile({ runtime: "go" });
    expect(result.output).toContain("FROM golang:1.22-alpine AS builder");
    expect(result.output).toContain("gcr.io/distroless/static");
    expect(result.output).toContain("go build");
  });

  it("uses custom go version", () => {
    const result = generateDockerfile({ runtime: "go", version: "1.21" });
    expect(result.output).toContain("FROM golang:1.21-alpine AS builder");
  });
});

describe("generateDockerfile - rust", () => {
  it("generates a multi-stage Dockerfile for rust", () => {
    const result = generateDockerfile({ runtime: "rust" });
    expect(result.output).toContain("FROM rust:1.75-slim AS builder");
    expect(result.output).toContain("gcr.io/distroless/cc");
    expect(result.output).toContain("cargo build --release");
  });
});

describe("generateDockerfile - java", () => {
  it("generates a multi-stage Dockerfile for java", () => {
    const result = generateDockerfile({ runtime: "java" });
    expect(result.output).toContain("FROM eclipse-temurin:21-jdk AS builder");
    expect(result.output).toContain("FROM eclipse-temurin:21-jre AS runner");
    expect(result.output).toContain("mvn package");
  });
});

describe("generateDockerfile - static", () => {
  it("generates a Dockerfile for static sites using nginx", () => {
    const result = generateDockerfile({ runtime: "static" });
    expect(result.output).toContain("FROM node:20-alpine AS builder");
    expect(result.output).toContain("FROM nginx:alpine AS runner");
    expect(result.output).toContain("nginx");
  });

  it("copies dist output to nginx html dir", () => {
    const result = generateDockerfile({ runtime: "static" });
    expect(result.output).toContain("/usr/share/nginx/html");
  });
});

describe("generateDockerfile - general", () => {
  it("always returns an output property", () => {
    const result = generateDockerfile({ runtime: "node" });
    expect(result).toHaveProperty("output");
    expect(typeof result.output).toBe("string");
  });

  it("output is non-empty", () => {
    for (const runtime of ["node", "python", "go", "rust", "java", "static"] as const) {
      const result = generateDockerfile({ runtime });
      expect(result.output.length).toBeGreaterThan(0);
    }
  });

  it("always contains a WORKDIR instruction", () => {
    for (const runtime of ["node", "python", "go", "rust", "java", "static"] as const) {
      const result = generateDockerfile({ runtime });
      expect(result.output).toContain("WORKDIR");
    }
  });

  it("always contains an EXPOSE instruction", () => {
    for (const runtime of ["node", "python", "go", "rust", "java", "static"] as const) {
      const result = generateDockerfile({ runtime });
      expect(result.output).toContain("EXPOSE");
    }
  });
});
