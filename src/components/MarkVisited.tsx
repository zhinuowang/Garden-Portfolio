"use client";

import { useEffect } from "react";
import { markVisited } from "@/lib/gardenMemory";

// Records a case-study visit so a tiny flower blooms by its garden landmark.
export default function MarkVisited({ slug }: { slug: string }) {
  useEffect(() => markVisited(slug), [slug]);
  return null;
}
