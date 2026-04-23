/** HttpOnly session cookie — value is opaque token (hashed in DB). */
export const SESSION_COOKIE_NAME = "__stime_session";

/** Plain org id (cuid) when user has membership OR super-admin elevation. */
export const ACTIVE_ORG_COOKIE_NAME = "__stime_active_org";

export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days
