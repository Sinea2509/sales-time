export type FeedbackType = "BUG" | "IDEA" | "QUESTION" | "OTHER";
export type FeedbackStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "WONT_FIX";
export type FeedbackPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FeedbackListFilters = {
  status?: FeedbackStatus | null;
  type?: FeedbackType | null;
  priority?: FeedbackPriority | null;
  hasScreenshot?: boolean | null;
  hasTargetElement?: boolean | null;
  limit?: number;
  offset?: number;
};

export type FeedbackRow = {
  id: string;
  organizationId: string | null;
  userId: string | null;
  userEmail: string | null;
  companyName: string | null;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  screenshotUrl: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  viewport: string | null;
  screenSize: string | null;
  locale: string | null;
  appVersion: string | null;
  consoleErrors: unknown;
  extra: unknown;
  adminNotes: string | null;
  handledAt: Date | null;
  createdAt: Date;
};

export interface FeedbackRepositoryPort {
  create(input: Omit<FeedbackRow, "id" | "status" | "adminNotes" | "handledAt" | "createdAt">): Promise<FeedbackRow>;

  list(input: FeedbackListFilters): Promise<{ rows: FeedbackRow[]; total: number }>;

  countGroupedByStatus(): Promise<Record<FeedbackStatus, number> & { all: number }>;

  findById(id: string): Promise<FeedbackRow | null>;

  updateStatus(input: {
    id: string;
    status: FeedbackStatus;
    adminNotes?: string | null;
  }): Promise<boolean>;

  countOpen(): Promise<number>;

  purgeOlderThan(before: Date): Promise<number>;
}
