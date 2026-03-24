interface StatCardProps {
  label: string;
  value: string | number;
  delta: string;
  deltaType: "up" | "down" | "neutral";
}

export default function StatCard({ label, value, delta, deltaType }: StatCardProps) {
  const deltaColors = {
    up: "text-accent",
    down: "text-c-red",
    neutral: "text-text-3",
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-2.5 text-xs font-medium uppercase tracking-[0.08em] text-text-3">
        {label}
      </div>
      <div className="mb-1.5 font-serif text-[1.75rem] font-light leading-none text-text">
        {value}
      </div>
      <div className={`flex items-center gap-1 text-xs ${deltaColors[deltaType]}`}>
        {delta}
      </div>
    </div>
  );
}
