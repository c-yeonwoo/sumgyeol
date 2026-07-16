import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PillTone = "new" | "tide" | "muted" | "alert" | "warm";

const TONE: Record<PillTone, string> = {
  new: "bg-warm-wash text-warm-foreground",
  warm: "bg-warm-wash text-warm-foreground",
  tide: "bg-accent/12 text-tide-mid",
  muted: "bg-secondary text-muted-foreground",
  alert: "bg-destructive/12 text-destructive",
};

// Small state chip — color encodes loop state so it reads at a glance.
export function Pill({
  tone,
  ping,
  children,
}: {
  tone: PillTone;
  ping?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        TONE[tone],
      )}
    >
      {ping && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-floatie-ping rounded-full bg-warm" />
          <span className="relative inline-flex size-1.5 rounded-full bg-warm" />
        </span>
      )}
      {children}
    </span>
  );
}
