import { describe, expect, it } from "bun:test";
import { generateRobotsTxt } from "./index";

describe("generateRobotsTxt", () => {
  it("generates a single rule for * with disallow", () => {
    const result = generateRobotsTxt([{ userAgent: "*", disallow: ["/private"] }]);
    expect(result.output).toBe("User-agent: *\nDisallow: /private");
  });

  it("generates multiple rules each with their own User-agent block", () => {
    const result = generateRobotsTxt([
      { userAgent: "*", disallow: ["/private"] },
      { userAgent: "Googlebot", disallow: ["/no-google"] },
    ]);
    expect(result.output).toContain("User-agent: *");
    expect(result.output).toContain("Disallow: /private");
    expect(result.output).toContain("User-agent: Googlebot");
    expect(result.output).toContain("Disallow: /no-google");
    // Blocks are separated by a blank line
    const blocks = result.output.split("\n\n");
    expect(blocks).toHaveLength(2);
  });

  it("includes Crawl-delay when crawlDelay is set", () => {
    const result = generateRobotsTxt([{ userAgent: "*", disallow: ["/"], crawlDelay: 10 }]);
    expect(result.output).toContain("Crawl-delay: 10");
  });

  it("does not include Crawl-delay when crawlDelay is not set", () => {
    const result = generateRobotsTxt([{ userAgent: "*", disallow: ["/"] }]);
    expect(result.output).not.toContain("Crawl-delay");
  });

  it("appends Sitemap URL at the end when provided", () => {
    const result = generateRobotsTxt(
      [{ userAgent: "*", disallow: [] }],
      "https://example.com/sitemap.xml"
    );
    expect(result.output).toContain("Sitemap: https://example.com/sitemap.xml");
    // Sitemap comes after the rules block
    const lines = result.output.split("\n");
    const sitemapIdx = lines.findIndex((l) => l.startsWith("Sitemap:"));
    const userAgentIdx = lines.findIndex((l) => l.startsWith("User-agent:"));
    expect(sitemapIdx).toBeGreaterThan(-1);
    expect(sitemapIdx).toBeGreaterThan(userAgentIdx);
  });

  it("includes both Allow and Disallow directives when both are present", () => {
    const result = generateRobotsTxt([
      {
        userAgent: "*",
        allow: ["/public"],
        disallow: ["/private"],
      },
    ]);
    expect(result.output).toContain("Allow: /public");
    expect(result.output).toContain("Disallow: /private");
  });

  it("prepends '/' to paths that are missing a leading slash", () => {
    const result = generateRobotsTxt([
      {
        userAgent: "*",
        allow: ["public"],
        disallow: ["private/admin"],
      },
    ]);
    expect(result.output).toContain("Allow: /public");
    expect(result.output).toContain("Disallow: /private/admin");
  });

  it("does not double-prepend '/' for paths that already have one", () => {
    const result = generateRobotsTxt([{ userAgent: "*", disallow: ["/already-correct"] }]);
    expect(result.output).toContain("Disallow: /already-correct");
    expect(result.output).not.toContain("Disallow: //already-correct");
  });

  it("returns empty string for an empty rules array with no sitemap", () => {
    const result = generateRobotsTxt([]);
    expect(result.output).toBe("");
  });

  it("returns only the Sitemap line when rules array is empty but sitemap is given", () => {
    const result = generateRobotsTxt([], "https://example.com/sitemap.xml");
    expect(result.output).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("handles a full rule with all fields", () => {
    const result = generateRobotsTxt(
      [
        {
          userAgent: "Bingbot",
          allow: ["/news"],
          disallow: ["/admin", "/private"],
          crawlDelay: 5,
        },
      ],
      "https://example.com/sitemap.xml"
    );
    expect(result.output).toBe(
      [
        "User-agent: Bingbot",
        "Allow: /news",
        "Disallow: /admin",
        "Disallow: /private",
        "Crawl-delay: 5",
        "",
        "Sitemap: https://example.com/sitemap.xml",
      ].join("\n")
    );
  });
});
