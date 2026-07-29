"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AppAuthProvider } from "@/contexts/AppAuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  // Each browser session gets its own QueryClient to avoid shared state
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppAuthProvider>
        <TooltipProvider>
          <Toaster />
          {children}
        </TooltipProvider>
      </AppAuthProvider>
    </QueryClientProvider>
  );
}
