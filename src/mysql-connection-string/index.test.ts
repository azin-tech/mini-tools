import { describe, expect, it } from "bun:test";
import { buildMysqlConnectionString } from "./index";

describe("buildMysqlConnectionString", () => {
  // --- happy path ---

  it("builds a basic connection string with host, database, and user", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toBe("mysql://admin@localhost:3306/mydb");
    expect(result.jdbc).toBe("jdbc:mysql://localhost:3306/mydb?user=admin");
    expect(result.env).toBe(`DATABASE_URL="mysql://admin@localhost:3306/mydb"`);
  });

  it("includes the password in the URL when provided", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "secret",
    });
    expect(result.url).toContain("admin:secret@");
    expect(result.url).toStartWith("mysql://");
  });

  it("uses port 3306 by default", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toContain(":3306/");
    expect(result.jdbc).toContain(":3306/");
  });

  it("uses the custom port when provided", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      port: 3307,
      database: "mydb",
      user: "admin",
    });
    expect(result.url).toContain(":3307/");
    expect(result.jdbc).toContain(":3307/");
  });

  it("adds ?ssl=true to URL and useSSL=true to JDBC when ssl is true", () => {
    const result = buildMysqlConnectionString({
      host: "db.example.com",
      database: "mydb",
      user: "admin",
      ssl: true,
    });
    expect(result.url).toContain("?ssl=true");
    expect(result.jdbc).toContain("useSSL=true");
  });

  it("omits SSL params when ssl is false", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      ssl: false,
    });
    expect(result.url).not.toContain("ssl");
    expect(result.jdbc).not.toContain("useSSL");
  });

  it("omits SSL params when ssl is not specified", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.url).not.toContain("ssl");
    expect(result.jdbc).not.toContain("useSSL");
  });

  it("generates a valid JDBC connection string with user and password", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "secret",
    });
    expect(result.jdbc).toStartWith("jdbc:mysql://");
    expect(result.jdbc).toContain("user=admin");
    expect(result.jdbc).toContain("password=secret");
  });

  it("wraps the URL in DATABASE_URL= for the env format", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    expect(result.env).toMatch(/^DATABASE_URL="mysql:\/\/.*"$/);
  });

  it("omits the colon and password from URL when no password is provided", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
    });
    // Should be "admin@" not "admin:@"
    expect(result.url).toContain("admin@localhost");
    expect(result.url).not.toContain("admin:@");
  });

  // --- edge cases: special chars in password ---

  it("URL-encodes special chars in the password (@, /, ?)", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "p@ss/w?rd",
    });
    // encodeURIComponent("p@ss/w?rd") => "p%40ss%2Fw%3Frd"
    expect(result.url).toContain("p%40ss%2Fw%3Frd");
    expect(result.url).not.toContain("p@ss/w?rd");
  });

  it("URL-encodes a password with spaces and ampersands", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "my pass&word",
    });
    expect(result.url).toContain(encodeURIComponent("my pass&word"));
  });

  it("handles an empty password string (omits it from URL)", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "",
    });
    // Empty password is falsy — should be omitted
    expect(result.url).toContain("admin@localhost");
    expect(result.url).not.toContain("admin:@");
  });

  it("builds a full connection string with all options", () => {
    const result = buildMysqlConnectionString({
      host: "db.example.com",
      port: 3308,
      database: "production",
      user: "root",
      password: "str0ng!",
      ssl: true,
    });
    expect(result.url).toStartWith("mysql://root:");
    expect(result.url).toContain("@db.example.com:3308/production");
    expect(result.url).toContain("ssl=true");
    expect(result.jdbc).toContain("jdbc:mysql://db.example.com:3308/production");
    expect(result.jdbc).toContain("useSSL=true");
    expect(result.env).toStartWith('DATABASE_URL="mysql://');
  });

  it("env string is the URL wrapped in double quotes", () => {
    const result = buildMysqlConnectionString({
      host: "localhost",
      database: "mydb",
      user: "admin",
      password: "secret",
      ssl: true,
    });
    expect(result.env).toBe(`DATABASE_URL="${result.url}"`);
  });
});
