import type { ReactNode } from "react";
import { BottleGlyph } from "./bottle-glyph";

type EmptyStateProps = {
  title: string;
  description?: string;
  state?: "drift" | "open";
  action?: ReactNode;
};

// Polished, on-brand empty state: the bottle mascot bobbing in a soft aqua sea
// halo, a warm headline, and an optional action. Replaces bare text / dashed boxes.
export function EmptyState({ title, description, state = "drift", action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      <div className="relative grid size-36 place-items-center">
        <div className="absolute inset-0 rounded-full bg-accent/10" />
        <div className="absolute inset-4 rounded-full bg-accent/10" />
        <BottleGlyph state={state} className="relative w-16 animate-floatie-bob" />
      </div>
      <p className="mt-5 text-lg font-bold tracking-[-0.01em]">{title}</p>
      {description && (
        <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
