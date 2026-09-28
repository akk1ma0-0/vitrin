"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { WorkCard } from "@/components/portfolio/work-card";
import { Badge } from "@/components/ui/badge";
import type { PublicWork } from "@/lib/profiles";
import { cn } from "@/lib/utils";

export function WorkGrid({
  works,
  onExpand,
}: {
  works: PublicWork[];
  onExpand: (workId: string) => void;
}) {
  const t = useTranslations("profile");
  const tCategory = useTranslations("categories");
  const categories = useMemo(
    () => Array.from(new Set(works.map((w) => w.category).filter((c): c is string => Boolean(c)))),
    [works],
  );
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visibleWorks = activeCategory ? works.filter((w) => w.category === activeCategory) : works;

  if (works.length === 0) {
    return <p className="py-16 text-center text-sm text-muted-foreground">{t("emptyState")}</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {categories.length >= 2 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => setActiveCategory(null)}>
            <Badge variant={activeCategory === null ? "default" : "secondary"} className={cn("cursor-pointer")}>
              {t("filterAll")}
            </Badge>
          </button>
          {categories.map((category) => (
            <button key={category} onClick={() => setActiveCategory(category)}>
              <Badge variant={activeCategory === category ? "default" : "secondary"} className="cursor-pointer">
                {tCategory.has(category) ? tCategory(category) : category}
              </Badge>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleWorks.map((work) => (
          <WorkCard key={work.id} work={work} onExpand={() => onExpand(work.id)} />
        ))}
      </div>
    </div>
  );
}
