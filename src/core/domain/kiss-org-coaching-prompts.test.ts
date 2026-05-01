import { describe, expect, it } from "@jest/globals";
import {
  buildKissOrgMarkdownAppendix,
  emptyKissCoachingPromptsForm,
  kissCoachingPromptsFromJson,
  kissCoachingPromptsFullFormSchema,
  kissCoachingPromptsToJson,
} from "./kiss-org-coaching-prompts";

const lines = (g: string, m: string, c: string) => ({ global: g, manager: m, commercial: c });

const fullAudience = () => ({
  global: "g",
  manager: "m",
  commercial: "c",
});

describe("kiss-org-coaching-prompts", () => {
  it("validates full form schema", () => {
    const ok = kissCoachingPromptsFullFormSchema.safeParse({
      keep: fullAudience(),
      improve: fullAudience(),
      start: fullAudience(),
      stop: fullAudience(),
    });
    expect(ok.success).toBe(true);
    expect(kissCoachingPromptsFullFormSchema.safeParse({}).success).toBe(false);
  });

  it("builds an empty form and round-trips JSON", () => {
    const empty = emptyKissCoachingPromptsForm();
    expect(kissCoachingPromptsToJson(empty)).toBeNull();
    expect(kissCoachingPromptsFromJson(null)).toEqual(empty);
    expect(kissCoachingPromptsFromJson({})).toEqual(empty);
  });

  it("merges partial JSON into the form", () => {
    const merged = kissCoachingPromptsFromJson({
      keep: { global: "  x  ", manager: undefined, commercial: " c " },
    });
    expect(merged.keep).toEqual({ global: "x", manager: "", commercial: "c" });
  });

  it("returns base form when JSON is invalid", () => {
    const base = emptyKissCoachingPromptsForm();
    const merged = kissCoachingPromptsFromJson({ keep: "not-an-object" });
    expect(merged).toEqual(base);
  });

  it("serializes non-empty quadrants to JSON", () => {
    const form = emptyKissCoachingPromptsForm();
    form.keep.global = " only ";
    expect(kissCoachingPromptsToJson(form)).toEqual({
      keep: { global: "only" },
    });
  });

  it("builds markdown appendix for manager and commercial audiences", () => {
    const form = emptyKissCoachingPromptsForm();
    form.keep.global = "G";
    form.keep.manager = "M";
    form.keep.commercial = "C";
    expect(buildKissOrgMarkdownAppendix(form, "manager")).toContain("manager");
    expect(buildKissOrgMarkdownAppendix(form, "commercial")).toContain("commercial");
  });

  it("skips quadrants with no content and returns empty when nothing to say", () => {
    expect(buildKissOrgMarkdownAppendix(emptyKissCoachingPromptsForm(), "manager")).toBe("");
    expect(buildKissOrgMarkdownAppendix(null, "manager")).toBe("");
    const form = emptyKissCoachingPromptsForm();
    form.keep.manager = "mgr only";
    expect(buildKissOrgMarkdownAppendix(form, "manager")).toContain("mgr only");
  });

  it("includes only global when audience line is empty", () => {
    const form = emptyKissCoachingPromptsForm();
    form.improve.global = "body";
    const md = buildKissOrgMarkdownAppendix(form, "commercial");
    expect(md).toContain("body");
    expect(md).not.toContain("Lecture commercial");
  });

  it("serializes multiple quadrants with trimmed fields", () => {
    const form = emptyKissCoachingPromptsForm();
    form.keep = lines("a", "", "");
    form.stop = lines("", "b", "");
    const json = kissCoachingPromptsToJson(form);
    expect(json).toEqual({
      keep: { global: "a" },
      stop: { manager: "b" },
    });
  });

  it("serializes commercial-only lines without manager", () => {
    const form = emptyKissCoachingPromptsForm();
    form.improve = lines("", "", "  only commercial  ");
    expect(kissCoachingPromptsToJson(form)).toEqual({
      improve: { commercial: "only commercial" },
    });
  });
});
