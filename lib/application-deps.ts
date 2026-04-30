import { cache } from "react";
import { makeApplicationDeps } from "@/src/adapters/composition";

export type { ApplicationDeps } from "@/src/adapters/composition";

/** Request-scoped application dependency graph (React cache dedupes per request). */
export const getApplicationDeps = cache(() => makeApplicationDeps());
