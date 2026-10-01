import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Pro-gated stat card (spec section 8's "full statistics" row): a Free-plan
 * viewer sees the section's name (dimmed) and a centered "Pro" badge, never
 * the underlying numbers — not even blurred, so there's nothing to infer.
 */
export function StatSection({
  title,
  isPro,
  children,
}: {
  title: string;
  isPro: boolean;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle
          className={cn("text-sm font-medium", isPro ? "text-foreground" : "text-muted-foreground/50")}
        >
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPro ? (
          children
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg bg-surface">
            <Badge variant="secondary">Pro</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
