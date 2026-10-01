"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/lib/specializations";

const SEARCH_DEBOUNCE_MS = 400;

export function CatalogFilters({ basePath }: { basePath: string }) {
  const t = useTranslations("catalog");
  const tSpec = useTranslations("specializations");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    next.delete("page"); // any filter change restarts pagination
    router.push(`${basePath}${next.toString() ? `?${next}` : ""}`);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSearchChange(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ q: value || null }), SEARCH_DEBOUNCE_MS);
  }

  const specialization = searchParams.get("specialization") ?? "all";
  const availableOnly = searchParams.get("available") === "1";
  const sort = searchParams.get("sort") ?? "relevance";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-9"
        />
      </div>

      <Select
        value={specialization}
        onValueChange={(value) => updateParams({ specialization: value === "all" ? null : value })}
      >
        <SelectTrigger className="sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allSpecializations")}</SelectItem>
          {SPECIALIZATIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {tSpec(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(value) => updateParams({ sort: value === "relevance" ? null : value })}>
        <SelectTrigger className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="relevance">{t("sortRelevance")}</SelectItem>
          <SelectItem value="newest">{t("sortNewest")}</SelectItem>
          <SelectItem value="popular">{t("sortPopular")}</SelectItem>
        </SelectContent>
      </Select>

      <Label className="flex items-center gap-2 text-sm font-normal text-muted-foreground">
        <Checkbox
          checked={availableOnly}
          onCheckedChange={(checked) => updateParams({ available: checked ? "1" : null })}
        />
        {t("availableOnly")}
      </Label>
    </div>
  );
}
