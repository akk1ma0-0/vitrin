"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function MobileNav({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("dashboard.nav");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label={t("menu")}>
        <Menu className="h-5 w-5" />
      </Button>
      <DialogContent className="left-0 top-0 h-dvh w-64 max-w-[80vw] translate-x-0 translate-y-0 gap-0 rounded-none border-r border-border border-l-0 border-t-0 border-b-0 p-0 sm:rounded-none">
        <DialogTitle className="sr-only">{t("menu")}</DialogTitle>
        <div className="flex h-16 items-center px-4">
          <Link href={`/${locale}`} onClick={() => setOpen(false)}>
            <Logo />
          </Link>
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
