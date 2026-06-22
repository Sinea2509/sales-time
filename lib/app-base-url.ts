export function getAppBaseUrl(): string {
  return process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
