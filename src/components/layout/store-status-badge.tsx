"use client";

import { useTranslations } from "next-intl";
import { api } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

type OpeningHours = Record<string, { open: string; close: string }>;

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function isWithinHours(
  currentHours: number,
  currentMinutes: number,
  openTime: string,
  closeTime: string
): boolean {
  const open = parseTime(openTime);
  const close = parseTime(closeTime);

  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const openTotalMinutes = open.hours * 60 + open.minutes;
  const closeTotalMinutes = close.hours * 60 + close.minutes;

  return (
    currentTotalMinutes >= openTotalMinutes &&
    currentTotalMinutes < closeTotalMinutes
  );
}

export function StoreStatusBadge() {
  const t = useTranslations("storeStatus");
  const { data: storeSettings } = api.storeSettings.get.useQuery();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo(() => {
    if (!storeSettings?.openingHours) {
      return { isOpen: false, message: t("closed"), closeTime: null };
    }

    const openingHours = storeSettings.openingHours as OpeningHours;
    const now = currentTime;
    const currentDay = DAY_NAMES[now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const todayHours = openingHours[currentDay];

    // Check if store is open today
    if (todayHours && todayHours.open && todayHours.close) {
      const isOpen = isWithinHours(
        currentHours,
        currentMinutes,
        todayHours.open,
        todayHours.close
      );

      if (isOpen) {
        return {
          isOpen: true,
          message: t("openUntil", { time: todayHours.close }),
          closeTime: todayHours.close,
        };
      }

      // Check if store will open later today
      const openTime = parseTime(todayHours.open);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const openTotalMinutes = openTime.hours * 60 + openTime.minutes;

      if (currentTotalMinutes < openTotalMinutes) {
        return {
          isOpen: false,
          message: t("opensAt", { time: todayHours.open }),
          closeTime: null,
        };
      }
    }

    // Store is closed - find next opening time
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDay = DAY_NAMES[nextDayIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours && nextDayHours.open) {
        if (i === 1) {
          return {
            isOpen: false,
            message: t("opensTomorrow", { time: nextDayHours.open }),
            closeTime: null,
          };
        }
        return {
          isOpen: false,
          message: t("opensAt", { time: nextDayHours.open }),
          closeTime: null,
        };
      }
    }

    return { isOpen: false, message: t("closed"), closeTime: null };
  }, [storeSettings, currentTime, t]);

  return (
    <div
      className={cn(
        "hidden md:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        status.isOpen
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full animate-pulse",
          status.isOpen ? "bg-green-500" : "bg-red-500"
        )}
      />
      <Clock className="h-3 w-3" />
      <span>{status.message}</span>
    </div>
  );
}

// Compact mobile version - shows in header bar with clear open/closed indication
export function CompactStoreStatusBadge() {
  const { data: storeSettings } = api.storeSettings.get.useQuery();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo(() => {
    if (!storeSettings?.openingHours) {
      return { isOpen: false, time: null };
    }

    const openingHours = storeSettings.openingHours as OpeningHours;
    const now = currentTime;
    const currentDay = DAY_NAMES[now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const todayHours = openingHours[currentDay];

    if (todayHours && todayHours.open && todayHours.close) {
      const isOpen = isWithinHours(
        currentHours,
        currentMinutes,
        todayHours.open,
        todayHours.close
      );

      if (isOpen) {
        return { isOpen: true, time: todayHours.close };
      }

      const openTime = parseTime(todayHours.open);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const openTotalMinutes = openTime.hours * 60 + openTime.minutes;

      if (currentTotalMinutes < openTotalMinutes) {
        return { isOpen: false, time: todayHours.open };
      }
    }

    // Find next opening
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDay = DAY_NAMES[nextDayIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours && nextDayHours.open) {
        return { isOpen: false, time: nextDayHours.open };
      }
    }

    return { isOpen: false, time: null };
  }, [storeSettings, currentTime]);

  // Show clear open/closed badge with time context
  return (
    <div
      className={cn(
        "flex md:hidden items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
        status.isOpen
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full flex-shrink-0",
          status.isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
        )}
      />
      <Clock className="h-2.5 w-2.5" />
      {status.isOpen ? (
        <span className="tabular-nums">{status.time}</span>
      ) : (
        <span className="tabular-nums">Opens {status.time}</span>
      )}
    </div>
  );
}

// Mobile version of the store status badge (full version for menu)
export function MobileStoreStatusBadge() {
  const t = useTranslations("storeStatus");
  const { data: storeSettings } = api.storeSettings.get.useQuery();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo(() => {
    if (!storeSettings?.openingHours) {
      return { isOpen: false, message: t("closed"), closeTime: null };
    }

    const openingHours = storeSettings.openingHours as OpeningHours;
    const now = currentTime;
    const currentDay = DAY_NAMES[now.getDay()];
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    const todayHours = openingHours[currentDay];

    if (todayHours && todayHours.open && todayHours.close) {
      const isOpen = isWithinHours(
        currentHours,
        currentMinutes,
        todayHours.open,
        todayHours.close
      );

      if (isOpen) {
        return {
          isOpen: true,
          message: t("openUntil", { time: todayHours.close }),
          closeTime: todayHours.close,
        };
      }

      const openTime = parseTime(todayHours.open);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const openTotalMinutes = openTime.hours * 60 + openTime.minutes;

      if (currentTotalMinutes < openTotalMinutes) {
        return {
          isOpen: false,
          message: t("opensAt", { time: todayHours.open }),
          closeTime: null,
        };
      }
    }

    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDay = DAY_NAMES[nextDayIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours && nextDayHours.open) {
        if (i === 1) {
          return {
            isOpen: false,
            message: t("opensTomorrow", { time: nextDayHours.open }),
            closeTime: null,
          };
        }
        return {
          isOpen: false,
          message: t("opensAt", { time: nextDayHours.open }),
          closeTime: null,
        };
      }
    }

    return { isOpen: false, message: t("closed"), closeTime: null };
  }, [storeSettings, currentTime, t]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium",
        status.isOpen
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full animate-pulse",
          status.isOpen ? "bg-green-500" : "bg-red-500"
        )}
      />
      <Clock className="h-4 w-4" />
      <span>{status.message}</span>
    </div>
  );
}
