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
