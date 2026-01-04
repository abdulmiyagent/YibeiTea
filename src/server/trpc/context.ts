import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createTRPCContext() {
  const session = await getServerSession(authOptions);

  return {
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
