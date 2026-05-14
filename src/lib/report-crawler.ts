import * as cheerio from "cheerio";

import { getDomain } from "@/lib/report-validation";
import type { ReportItem } from "@/types/report";

const REQUEST_TIMEOUT_MS = 12_000;

export async function crawlArticle(url: string): Promise<ReportItem> {
  const domain = getDomain(url);
  const crawledAt = new Date().toISOString();

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const title =
      getMetaContent($, 'meta[property="og:title"]') ||
      getMetaContent($, 'meta[name="twitter:title"]') ||
      getText($, "h1") ||
      getText($, "title") ||
      "Untitled article";

    const category =
      getMetaContent($, 'meta[property="article:section"]') ||
      getMetaContent($, 'meta[name="category"]') ||
      getBreadcrumbCategory($) ||
      getText($, 'a[href*="/category/"]') ||
      getText($, 'a[href*="/categories/"]') ||
      "Uncategorized";

    const description =
      getMetaContent($, 'meta[property="og:description"]') ||
      getMetaContent($, 'meta[name="description"]') ||
      "";

    const author =
      getMetaContent($, 'meta[name="author"]') ||
      getMetaContent($, 'meta[property="article:author"]') ||
      getText($, ".author") ||
      getText($, ".byline") ||
      getText($, '[rel="author"]') ||
      "";

    const publishedTime =
      getMetaContent($, 'meta[property="article:published_time"]') ||
      getAttribute($, "time[datetime]", "datetime") ||
      "";

    return {
      url,
      domain,
      title: normalizeWhitespace(title),
      category: normalizeWhitespace(category),
      description: normalizeWhitespace(description),
      author: normalizeWhitespace(author),
      publishedTime: normalizeWhitespace(publishedTime),
      status: "success",
      error: "",
      crawledAt,
    };
  } catch (error) {
    return {
      url,
      domain,
      title: "",
      category: "Uncategorized",
      description: "",
      author: "",
      publishedTime: "",
      status: "failed",
      error: error instanceof Error ? error.message : "Failed to crawl this URL.",
      crawledAt,
    };
  }
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; PR-Report-Generator/1.0; +https://vercel.com)",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 12 seconds.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getMetaContent($: cheerio.CheerioAPI, selector: string) {
  return normalizeWhitespace($(selector).attr("content") ?? "");
}

function getAttribute($: cheerio.CheerioAPI, selector: string, attribute: string) {
  return normalizeWhitespace($(selector).first().attr(attribute) ?? "");
}

function getText($: cheerio.CheerioAPI, selector: string) {
  return normalizeWhitespace($(selector).first().text());
}

function getBreadcrumbCategory($: cheerio.CheerioAPI) {
  const selectors = [
    ".breadcrumb a",
    ".breadcrumbs a",
    'nav[aria-label*="breadcrumb" i] a',
  ];

  for (const selector of selectors) {
    const texts = $(selector)
      .map((_, element) => normalizeWhitespace($(element).text()))
      .get()
      .filter(Boolean);

    const candidate = texts.at(-1);
    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
