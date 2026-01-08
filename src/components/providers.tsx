"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { api, createTRPCClient } from "@/lib/trpc";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Increased staleTime for better performance - data stays fresh longer
            staleTime: 5 * 60 * 1000, // 5 minutes instead of 1 minute
            cacheTime: 10 * 60 * 1000, // 10 minutes cache time (v4 syntax)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on component mount if data exists
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <SessionProvider>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </api.Provider>
    </SessionProvider>
  );
}
