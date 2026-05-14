"use client";

import { useState } from "react";

import { downloadCsvReport, downloadPdfReport } from "@/lib/report-export";
import { prepareUrls } from "@/lib/report-validation";
import type { ReportItem, ReportResponse, ReportRunRecord } from "@/types/report";
import { MAX_URLS } from "@/types/report";

const SAMPLE_INPUT = [
  "https://example.com/article-one",
  "https://example.com/article-two",
].join("\n");

const HISTORY_STORAGE_KEY = "pr-report-generator-history-items";
const HISTORY_LIMIT = 10;

export function ReportGenerator() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState<ReportItem[]>([]);
  const [formError, setFormError] = useState("");
  const [apiError, setApiError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<ReportRunRecord[]>(getInitialHistory);
  const rawLines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const uniqueInputCount = new Set(rawLines).size;
  const duplicateCount = rawLines.length - uniqueInputCount;
  const remainingSlots = Math.max(MAX_URLS - uniqueInputCount, 0);
  const queueTone =
    uniqueInputCount > MAX_URLS
      ? "text-amber-300"
      : uniqueInputCount === 0
        ? "text-slate-400"
        : "text-emerald-300";

  const successfulCount = items.filter((item) => item.status === "success").length;
  const failedCount = items.length - successfulCount;
  const uniqueCategories = new Set(items.map((item) => item.category).filter(Boolean)).size;
  const historyNotice = history.length > 0 ? "Latest crawl saved to local history." : "No crawl history yet.";

  const handleGenerateReport = async () => {
    const prepared = prepareUrls(input);

    if (!prepared.ok) {
      setFormError(prepared.error);
      setApiError("");
      setItems([]);
      return;
    }

    setFormError("");
    setApiError("");
    setIsGenerating(true);
    setItems([]);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls: prepared.urls }),
      });

      const data = (await response.json()) as ReportResponse & { error?: string };

      if (!response.ok) {
        setItems([]);
        setApiError(data.error ?? "Failed to generate report.");
        return;
      }

      setItems(data.items);
      saveHistory(data.items);
    } catch {
      setItems([]);
      setApiError("Network error while generating report.");
    } finally {
      setIsGenerating(false);
    }
  };

  function saveHistory(nextItems: ReportItem[]) {
    const historyItems = nextItems.map((item) => ({
      id: crypto.randomUUID(),
      user_id: "local-browser-history",
      total_urls: 1,
      successful_count: item.status === "success" ? 1 : 0,
      failed_count: item.status === "failed" ? 1 : 0,
      categories: item.category ? [item.category] : [],
      items: [item],
      created_at: item.crawledAt || new Date().toISOString(),
    }));

    const nextHistory = [...historyItems, ...history].slice(0, HISTORY_LIMIT);
    setHistory(nextHistory);

    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {
      return;
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef5fb_46%,_#f7f4ed_100%)] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_20px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-9">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                PR Report Generator
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-[3.35rem] sm:leading-[1.02]">
                  Crawl PR article URLs and export a clean reporting pack in minutes.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                  Paste up to five article URLs, extract title, category, and metadata on
                  the server, then download a client-ready PDF and a full CSV summary.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Server-side crawl" value="No CORS issues" />
                <StatCard label="Free-tier safe" value={`Max ${MAX_URLS} URLs`} />
                <StatCard label="Exports" value="PDF + CSV" />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800/90 bg-[linear-gradient(180deg,#070b1d_0%,#0b1023_100%)] p-5 text-white shadow-[0_18px_50px_rgba(2,6,23,0.24),inset_0_1px_0_rgba(255,255,255,0.08)]">
              {isGenerating ? (
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full w-1/3 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-emerald-300" />
                </div>
              ) : null}

              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Paste PR article URLs, one per line</h2>
                  <p className="mt-1 text-sm text-slate-300">
                    Server-side crawl with clean PDF and CSV export.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setInput(SAMPLE_INPUT)}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/10"
                >
                  Use sample
                </button>
              </div>

              <label className="block">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                  <span>Input Queue</span>
                  <span className={queueTone}>
                    {uniqueInputCount}/{MAX_URLS} unique URLs
                  </span>
                </div>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={"https://news-site.com/pr-article\nhttps://brand-site.com/media/newsroom/post"}
                  className="min-h-56 w-full rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.065),rgba(255,255,255,0.025))] px-4 py-4 font-mono text-sm leading-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none ring-0 placeholder:text-slate-500 transition focus:border-emerald-400/60 focus:bg-white/8 focus:shadow-[0_0_0_4px_rgba(52,211,153,0.12)]"
                />
              </label>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-3">
                  <QueueMetric label="URLs queued" value={String(uniqueInputCount)} />
                  <QueueMetric
                    label="Duplicates removed"
                    value={String(Math.max(duplicateCount, 0))}
                  />
                  <QueueMetric label="Slots left" value={String(remainingSlots)} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-slate-300">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-100">
                    Empty lines removed
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-100">
                    Duplicate URLs merged
                  </span>
                </div>
                {formError ? <p className="text-rose-300">{formError}</p> : null}
                {apiError ? <p className="text-rose-300">{apiError}</p> : null}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-400/70"
                >
                  {isGenerating ? "Generating report..." : "Generate Report"}
                </button>

                <button
                  type="button"
                  onClick={() => setInput("")}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Clear input
                </button>
              </div>
            </div>
          </div>
        </section>

        {items.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total URLs" value={String(items.length)} />
            <SummaryCard label="Successful crawls" value={String(successfulCount)} />
            <SummaryCard label="Failed crawls" value={String(failedCount)} />
            <SummaryCard label="Unique categories" value={String(uniqueCategories)} />
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Crawl Results</h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the five export columns before downloading PDF or CSV.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => downloadPdfReport(items)}
                disabled={items.length === 0 || isGenerating}
                className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => downloadCsvReport(items)}
                disabled={items.length === 0 || isGenerating}
                className="rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                Download CSV
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="border-b border-slate-100 px-6 py-3 text-sm text-slate-500">
              Generate a report to enable PDF and CSV exports.
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-medium">No.</th>
                  <th className="px-4 py-4 font-medium">URL</th>
                  <th className="px-4 py-4 font-medium">Title</th>
                  <th className="px-4 py-4 font-medium">Category</th>
                  <th className="px-4 py-4 font-medium">Source Domain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16">
                      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
                        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {isGenerating ? "Crawler Running" : "Ready for Input"}
                        </div>
                        <p className="text-base font-semibold text-slate-900">
                          {isGenerating
                            ? "Crawling article metadata and preparing exports..."
                            : "No report generated yet."}
                        </p>
                        <p className="text-sm text-slate-500">
                          {isGenerating
                            ? "Keep this tab open while the server fetches each URL."
                            : "Paste up to five PR article links above, then generate a report to unlock PDF and CSV export."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={`${item.url}-${index}`} className="align-top">
                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="line-clamp-2 break-all text-sky-700 underline decoration-sky-200 underline-offset-4"
                        >
                          {item.url}
                        </a>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="max-w-sm">
                          <p className="font-medium text-slate-900">
                            {item.title || "Untitled article"}
                          </p>
                          {item.description ? (
                            <p className="mt-1 line-clamp-2 text-slate-500">
                              {item.description}
                            </p>
                          ) : null}
                          {item.error ? (
                            <p className="mt-2 text-rose-600">{item.error}</p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        {item.category || "Uncategorized"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="space-y-2">
                          <p>{item.domain || "-"}</p>
                          <StatusBadge status={item.status} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_16px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Crawl History</h2>
                <p className="mt-1 text-sm text-slate-500">
                  The 10 most recent crawled articles saved locally in this browser.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Local history
              </span>
            </div>
          </div>

          <div className="px-6 py-5">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">{historyNotice || "No crawl history yet."}</p>
            ) : (
              <div className="grid gap-4">
                {history.map((run) => (
                  <article
                    key={run.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-950">
                        {run.items[0]?.title || "Untitled article"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(run.created_at)}
                      </p>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <p className="break-all text-sm leading-7 text-slate-900">
                        {run.items[0]?.url || "-"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {history.length > 0 && historyNotice ? (
              <p className="mt-4 text-sm text-emerald-700">{historyNotice}</p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] backdrop-blur">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
    </div>
  );
}

function QueueMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReportItem["status"] }) {
  const styles =
    status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {status}
    </span>
  );
}

function formatDateTime(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getInitialHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as ReportRunRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
