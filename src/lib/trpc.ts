"use client";

import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/routers";
import superjson from "superjson";

export const api = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  // When rendering on the server, use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function createTRPCClient() {
  return api.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
      }),
    ],
  });
}
