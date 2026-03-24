"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-7">
      <div className="max-w-md rounded-card border border-border bg-surface p-8 text-center">
        <div className="mb-3 text-2xl opacity-40">⚠</div>
        <h2 className="mb-2 font-serif text-lg text-text">Something went wrong</h2>
        <p className="mb-4 text-sm text-text-3">{error.message}</p>
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
