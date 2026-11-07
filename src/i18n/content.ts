"use client";

import { about, landingScenes } from "@/data/site";
import { getProject } from "@/data/projects";
import { fullCaseStudies } from "@/data/case-studies";
import type { FullCaseStudy } from "@/data/case-studies/types";
import { caseStudiesZh, localize } from "./zh/case-studies";
import { aboutZh, landingScenesZh, placesZh } from "./zh/site";
import { useLocale, type Locale } from "./locale";

// Page copy by language. English is always the original (src/data); Chinese is laid over it, so structure,
// images, links and order can never drift between the two — only the words change.

export function useLanding() {
  return useLocale() === "zh" ? landingScenesZh : landingScenes;
}

export function useAbout() {
  const zh = useLocale() === "zh";
  return zh
    ? { ...about, ...aboutZh, portrait: { ...about.portrait, alt: aboutZh.portraitAlt } }
    : about;
}

/** A project's landmark name ("The Puppy Corner" / "小狗角"). */
export function placeName(slug: string, locale: Locale) {
  const en = getProject(slug)?.locationName ?? "";
  return locale === "zh" ? placesZh[slug] ?? en : en;
}

const cache = new Map<string, FullCaseStudy>();

/** A full case study in the visitor's language (Chinese laid over the English original). */
export function useCaseStudy(slug: string): FullCaseStudy {
  const locale = useLocale();
  const en = fullCaseStudies[slug];
  if (locale === "en" || !caseStudiesZh[slug]) return en;
  if (!cache.has(slug)) cache.set(slug, localize(en, caseStudiesZh[slug]));
  return cache.get(slug)!;
}

/** The browser tab's title for a path, in a language. */
export function pageTitle(pathname: string, locale: Locale) {
  const zh = locale === "zh";
  const tail = zh ? "A Garden of Ideas — 王之诺" : "A Garden of Ideas — Zhinuo Wang";
  if (pathname === "/") return zh ? "A Garden of Ideas | 王之诺 — 设计作品集" : "A Garden of Ideas | Zhinuo Wang — Design Portfolio";
  if (pathname === "/about") return `${zh ? "关于我" : "About"} | ${tail}`;
  if (pathname === "/work") return `${zh ? "作品" : "Work"} | ${tail}`;
  if (pathname === "/contact") return `${zh ? "联系我" : "Contact"} | ${tail}`;
  const slug = pathname.match(/^\/work\/([^/]+)/)?.[1];
  const p = slug && getProject(slug);
  return p ? `${p.title} | ${tail}` : null;
}
