"use client";

import type { ProjectCategory } from "@/data/projects";
import { useUi } from "@/i18n/ui";

export default function CategoryBadge({ category }: { category: ProjectCategory }) {
  const personal = category === "personal";
  const t = useUi().category;
  return (
    <span
      data-category={category}
      className={`category-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ${
        personal ? "bg-[#f7ddd3] text-[#8a4a3c]" : "bg-[#dfe7d2] text-forest"
      }`}
    >
      <span aria-hidden="true" className={`category-badge__dot size-1.5 rounded-full ${personal ? "bg-[#c4705c]" : "bg-moss"}`} />
      {personal ? t.personal : t.academic}
    </span>
  );
}
