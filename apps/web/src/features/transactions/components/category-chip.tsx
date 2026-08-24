export function CategoryChip({ name, color }: { name: string; color: string | null }) {
  return (
    <span className="inline-flex max-w-40 items-center gap-1.5">
      <span
        className="size-2.5 shrink-0 rounded-full bg-muted-foreground"
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden
      />
      <span className="truncate">{name}</span>
    </span>
  );
}
