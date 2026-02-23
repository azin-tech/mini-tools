import { describe, expect, it } from "bun:test";
import { buildPgConnectionString } from "./index";

describe("buildPgConnectionString", () => {
  it("builds a basic connection string with host, database, and user", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toBe("postgresql://admin@localhost:5432/mydb");
    expect(result.jdbc).toBe("jdbc:postgresql://localhost:5432/mydb?user=admin");
    expect(result.env).toBe(`DATABASE_URL="postgresql://admin@localhost:5432/mydb"`);
  });

  it("includes the password in the URL when provided", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "secret",
    });
    expect(result.url).toContain("admin:secret@");
    expect(result.url).toStartWith("postgresql://");
  });

  it("URL-encodes special chars in the password (@, /, ?)", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "p@ss/w?rd",
    });
    // encodeURIComponent("p@ss/w?rd") => "p%40ss%2Fw%3Frd"
    expect(result.url).toContain("p%40ss%2Fw%3Frd");
    expect(result.url).not.toContain("p@ss/w?rd");
  });

  it("adds sslmode=require when ssl=true and no sslmode specified", () => {
    const result = buildPgConnectionString({
      host: "db.example.com",
      database: "mydb",
      user: "admin",
      ssl: true,
    });
    expect(result.url).toContain("sslmode=require");
    expect(result.jdbc).toContain("sslmode=require");
  });

  it("uses explicit sslmode when provided", () => {
    const result = buildPgConnectionString({
      host: "db.example.com",
      database: "mydb",
      user: "admin",
      sslmode: "verify-full",
    });
    expect(result.url).toContain("sslmode=verify-full");
    expect(result.jdbc).toContain("sslmode=verify-full");
  });

  it("prefers explicit sslmode over ssl=true", () => {
    const result = buildPgConnectionString({
      host: "db.example.com",
      database: "mydb",
      user: "admin",
      ssl: true,
      sslmode: "verify-ca",
    });
    expect(result.url).toContain("sslmode=verify-ca");
    expect(result.url).not.toContain("sslmode=require");
  });

  it("uses port 5432 by default", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toContain(":5432/");
    expect(result.jdbc).toContain(":5432/");
  });

  it("uses the custom port when provided", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      port: 5433,
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toContain(":5433/");
    expect(result.jdbc).toContain(":5433/");
  });

  it("generates a valid JDBC connection string with user and password", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "secret",
    });
    expect(result.jdbc).toStartWith("jdbc:postgresql://");
    expect(result.jdbc).toContain("user=admin");
    expect(result.jdbc).toContain("password=secret");
  });

  it("wraps the URL in DATABASE_URL= for the env format", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.env).toMatch(/^DATABASE_URL="postgresql:\/\/.*"$/);
  });

  it("includes application_name in URL and ApplicationName in JDBC when applicationName is set", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      applicationName: "my-app",
    });
    expect(result.url).toContain("application_name=my-app");
    expect(result.jdbc).toContain("ApplicationName=my-app");
  });

  it("omits the colon and password from URL when no password is provided", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    // Should be "admin@" not "admin:@"
    expect(result.url).toContain("admin@localhost");
    expect(result.url).not.toContain("admin:@");
  });

  it("does not add sslmode when ssl is not set and sslmode is not specified", () => {
    const result = buildPgConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).not.toContain("sslmode");
    expect(result.jdbc).not.toContain("sslmode");
  });
});
