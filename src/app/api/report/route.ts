import { NextResponse } from "next/server";

import { crawlArticle } from "@/lib/report-crawler";
import { validateUrlsPayload } from "@/lib/report-validation";
import type { ReportResponse } from "@/types/report";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const prepared = validateUrlsPayload(
    typeof body === "object" && body !== null ? (body as { urls?: unknown }).urls : undefined,
  );

  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: 400 });
  }

  const settled = await Promise.allSettled(
    prepared.urls.map((url) => crawlArticle(url)),
  );

  const items = settled.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      url: prepared.urls[index],
      domain: "",
      title: "",
      category: "Uncategorized",
      description: "",
      author: "",
      publishedTime: "",
      status: "failed" as const,
      error:
        result.reason instanceof Error
          ? result.reason.message
          : "Unexpected crawl failure.",
      crawledAt: new Date().toISOString(),
    };
  });

  const response: ReportResponse = { items };
  return NextResponse.json(response);
}
