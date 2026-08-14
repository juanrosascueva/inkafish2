import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="border border-gray-100 shadow-sm overflow-hidden">
      <CardContent className="p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-lg bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 w-2/5 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-3/5 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse" />
            <div className="h-3 w-10 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
