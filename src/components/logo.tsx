import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-lg font-semibold tracking-tight", className)}>
      vitrin
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" aria-hidden />
    </span>
  );
}
