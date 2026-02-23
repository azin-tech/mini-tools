export interface RobotsRule {
  userAgent: string; // "*" or specific bot name like "Googlebot"
  allow?: string[];
  disallow?: string[];
  crawlDelay?: number;
}

export interface RobotsResult {
  output: string;
}

function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

export function generateRobotsTxt(rules: RobotsRule[], sitemapUrl?: string): RobotsResult {
  if (rules.length === 0 && !sitemapUrl) {
    return { output: "" };
  }

  const blocks: string[] = [];

  for (const rule of rules) {
    const lines: string[] = [];

    lines.push(`User-agent: ${rule.userAgent}`);

    if (rule.allow) {
      for (const path of rule.allow) {
        lines.push(`Allow: ${normalizePath(path)}`);
      }
    }

    if (rule.disallow) {
      for (const path of rule.disallow) {
        lines.push(`Disallow: ${normalizePath(path)}`);
      }
    }

    if (rule.crawlDelay !== undefined) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`);
    }

    blocks.push(lines.join("\n"));
  }

  const parts: string[] = [blocks.join("\n\n")];

  if (sitemapUrl) {
    parts.push(`Sitemap: ${sitemapUrl}`);
  }

  return { output: parts.join("\n\n") };
}
