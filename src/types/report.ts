export const MAX_URLS = 5;

export type ReportStatus = "success" | "failed";

export type ReportItem = {
  url: string;
  domain: string;
  title: string;
  category: string;
  description: string;
  author: string;
  publishedTime: string;
  status: ReportStatus;
  error: string;
  crawledAt: string;
};

export type ReportResponse = {
  items: ReportItem[];
};

export type CrawlHistoryRecord = {
  id: string;
  url: string;
  domain: string;
  title: string;
  category: string;
  status: ReportStatus;
  crawled_at: string;
  created_at: string;
};
