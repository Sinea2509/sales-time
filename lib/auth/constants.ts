/** HttpOnly session cookie: value is an opaque token (hashed in DB). */
export const SESSION_COOKIE_NAME = "__stime_session";

/** Plain org id (cuid) when user has membership OR super-admin elevation. */
export const ACTIVE_ORG_COOKIE_NAME = "__stime_active_org";

/** Matches `getAuthSessionVersion()` at login; bumped on each release to force re-auth. */
export const SESSION_VERSION_COOKIE_NAME = "__stime_session_version";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
