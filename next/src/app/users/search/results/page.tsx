"use client";

import { Suspense } from "react";

import { LoadingSpinner } from "@/components/shared/loading-spinner";
import SearchResultsPage from "./search-results-content";

export default function SearchResultsRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      }
    >
      <SearchResultsPage />
    </Suspense>
  );
}
