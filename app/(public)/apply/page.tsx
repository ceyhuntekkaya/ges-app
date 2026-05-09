import { ApplyProjectsClient } from "@/components/public/ApplyProjectsClient";
import { Suspense } from "react";

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10">
          <div className="rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--surface-0)] p-7 shadow-[var(--shadow-xs)]">
            <div className="h-5 w-56 animate-pulse rounded bg-[var(--surface-2)]" />
            <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-[var(--surface-2)]" />
          </div>
        </div>
      }
    >
      <ApplyProjectsClient />
    </Suspense>
  );
}

