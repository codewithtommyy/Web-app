import { MAX_URLS } from "@/types/report";

export type PreparedUrlsResult =
  | {
      ok: true;
      urls: string[];
    }
  | {
      ok: false;
      error: string;
    };

export function prepareUrls(rawInput: string): PreparedUrlsResult {
  const lines = rawInput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const uniqueUrls = Array.from(new Set(lines));

  if (uniqueUrls.length === 0) {
    return { ok: false, error: "Please enter at least one article URL." };
  }

  if (uniqueUrls.length > MAX_URLS) {
    return {
      ok: false,
      error: `Maximum ${MAX_URLS} URLs per report to avoid timeout.`,
    };
  }

  const invalidUrl = uniqueUrls.find((url) => !isValidHttpUrl(url));
  if (invalidUrl) {
    return {
      ok: false,
      error: `Invalid URL format: ${invalidUrl}`,
    };
  }

  return { ok: true, urls: uniqueUrls };
}

export function validateUrlsPayload(value: unknown): PreparedUrlsResult {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Request body must contain a urls array." };
  }

  const rawInput = value
    .map((item) => (typeof item === "string" ? item : ""))
    .join("\n");

  return prepareUrls(rawInput);
}

export function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
