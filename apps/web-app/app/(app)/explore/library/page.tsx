"use client";

import { SiteHeader } from "@/components/site-header";

export default function ExploreLibraryPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-1 flex-col p-6 overflow-auto h-[calc(100vh-var(--header-height))]">
        <h1 className="text-2xl font-bold tracking-tight">Explore Library</h1>
        <p className="text-muted-foreground mt-2">
          Browse and discover research materials, scholarly articles, and
          curated datasets.
        </p>

        {/* Placeholder for library content/grid */}
        <div className="mt-8 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center min-h-32 text-muted-foreground bg-muted/50">
            Empty Library
          </div>
        </div>
      </div>
    </>
  );
}
