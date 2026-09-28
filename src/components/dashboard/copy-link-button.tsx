"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("linkCopied"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} aria-label={t("copyLink")}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}
