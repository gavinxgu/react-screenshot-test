export const BrowserEnum = ["chromium", "firefox", "webkit"] as const;
export type BrowserEnumType = typeof BrowserEnum[number];

export interface PageScreenshotBody {
  fullPage?: boolean;
  quality?: number;
  timeout?: number;
  type?: "png" | "jpeg";
}

export interface PageCreateBody {
  url: string;
  viewport?: { width: number; height: number };
  browser: BrowserEnumType;
}
