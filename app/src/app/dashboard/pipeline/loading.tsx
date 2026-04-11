import Topbar from "@/components/Topbar";

export default function PipelineLoading() {
  return (
    <>
      <Topbar title="Pipeline" subtitle="Loading…" />
      <div className="flex-1 p-4 lg:p-7">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex w-[280px] flex-shrink-0 flex-col rounded-card border border-border bg-surface"
            >
              <div className="border-b border-border px-4 py-3">
                <div className="h-5 w-20 animate-pulse rounded-full bg-surface-3" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-surface-3" />
              </div>
              <div className="flex flex-col gap-2 p-3">
                {Array.from({ length: 2 }).map((__, j) => (
                  <div
                    key={j}
                    className="h-[88px] animate-pulse rounded-lg border border-border bg-surface-2"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
