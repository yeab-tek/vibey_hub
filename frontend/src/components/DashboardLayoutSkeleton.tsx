"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex h-screen bg-[#0A0A0A]">
      {/* Sidebar skeleton */}
      <div className="w-[260px] border-r border-[#222] p-4 space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full bg-[#222]" />
          <Skeleton className="h-4 w-20 bg-[#222]" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 bg-[#222]" />
              <Skeleton className="h-4 w-24 bg-[#222]" />
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-10 w-full bg-[#222]" />
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-8 w-64 bg-[#222]" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-[#222]" />
          ))}
        </div>
        <Skeleton className="h-64 bg-[#222]" />
      </div>
    </div>
  );
}
