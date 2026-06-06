type Props = {
  category?: string | null;
  className?: string;
};

/**
 * Small pill badge for question categories (취향, 순간, 감정 등).
 * Used wherever a question is rendered so the user can read the tone at a glance.
 */
export function CategoryBadge({ category, className = "" }: Props) {
  if (!category) return null;
  return (
    <span
      className={
        "inline-flex items-center rounded-full border border-accent/40 bg-accent/8 px-2 py-0.5 text-[10px] font-medium tracking-widest text-accent uppercase " +
        className
      }
    >
      {category}
    </span>
  );
}
