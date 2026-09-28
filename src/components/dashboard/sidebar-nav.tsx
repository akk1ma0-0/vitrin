"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  CreditCard,
  Inbox,
  LayoutGrid,
  Settings,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", key: "overview", icon: LayoutGrid },
  { href: "/dashboard/works", key: "works", icon: LayoutGrid },
  { href: "/dashboard/profile", key: "profile", icon: User },
  { href: "/dashboard/inbox", key: "inbox", icon: Inbox },
  { href: "/dashboard/stats", key: "stats", icon: BarChart3 },
  { href: "/dashboard/settings", key: "settings", icon: Settings },
  { href: "/dashboard/billing", key: "billing", icon: CreditCard },
] as const;

export function SidebarNav() {
  const t = useTranslations("dashboard.nav");
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {ITEMS.map((item) => {
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
