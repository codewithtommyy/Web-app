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

export type ReportRunRecord = {
  id: string;
  user_id: string;
  total_urls: number;
  successful_count: number;
  failed_count: number;
  categories: string[];
  items: ReportItem[];
  created_at: string;
};
