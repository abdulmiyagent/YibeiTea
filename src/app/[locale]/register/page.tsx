"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Build the login URL with existing query params
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "register");

    router.replace(`/login?${params.toString()}`);
  }, [router, searchParams]);

  // Show nothing while redirecting
  return null;
}
