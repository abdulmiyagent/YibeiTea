import { useMemo, useState, useEffect } from "react";
import { api } from "@/lib/trpc";

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

export interface StoreStatus {
  isOpen: boolean;
  message: string;
  closeTime: string | null;
  openTime: string | null;
  todayHours: { open: string; close: string } | null;
  nextOpenDay: string | null;
  nextOpenTime: string | null;
}

export function useStoreStatus() {
  const { data: storeSettings, isLoading } = api.storeSettings.get.useQuery();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const status = useMemo((): StoreStatus => {
    if (!storeSettings?.openingHours) {
      return {
        isOpen: false,
        message: "Gesloten",
        closeTime: null,
        openTime: null,
        todayHours: null,
        nextOpenDay: null,
        nextOpenTime: null,
      };
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
          message: `Open tot ${todayHours.close}`,
          closeTime: todayHours.close,
          openTime: todayHours.open,
          todayHours,
          nextOpenDay: null,
          nextOpenTime: null,
        };
      }

      // Check if store will open later today
      const openTime = parseTime(todayHours.open);
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const openTotalMinutes = openTime.hours * 60 + openTime.minutes;

      if (currentTotalMinutes < openTotalMinutes) {
        return {
          isOpen: false,
          message: `Opent om ${todayHours.open}`,
          closeTime: null,
          openTime: todayHours.open,
          todayHours,
          nextOpenDay: currentDay,
          nextOpenTime: todayHours.open,
        };
      }
    }

    // Store is closed - find next opening time
    for (let i = 1; i <= 7; i++) {
      const nextDayIndex = (now.getDay() + i) % 7;
      const nextDay = DAY_NAMES[nextDayIndex];
      const nextDayHours = openingHours[nextDay];

      if (nextDayHours && nextDayHours.open) {
        const dayLabel = i === 1 ? "morgen" : nextDay;
        return {
          isOpen: false,
          message: i === 1 ? `Opent morgen om ${nextDayHours.open}` : `Opent om ${nextDayHours.open}`,
          closeTime: null,
          openTime: null,
          todayHours,
          nextOpenDay: nextDay,
          nextOpenTime: nextDayHours.open,
        };
      }
    }

    return {
      isOpen: false,
      message: "Gesloten",
      closeTime: null,
      openTime: null,
      todayHours: null,
      nextOpenDay: null,
      nextOpenTime: null,
    };
  }, [storeSettings, currentTime]);

  return {
    ...status,
    isLoading,
    openingHours: storeSettings?.openingHours as OpeningHours | undefined,
    currentTime,
  };
}

// Helper function to get the next available pickup date
export function getNextAvailableDate(isOpen: boolean): string {
  const today = new Date();
  if (isOpen) {
    return today.toISOString().split("T")[0];
  }
  // If closed, suggest tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

// Helper function to filter valid time slots based on current time
export function filterValidTimeSlots(
  slots: string[],
  selectedDate: string,
  minMinutesFromNow: number = 15
): string[] {
  const now = new Date();
  const selectedDateObj = new Date(selectedDate);
  const isToday = selectedDateObj.toDateString() === now.toDateString();

  if (!isToday) {
    return slots;
  }

  // For today, filter out past times and times too close to now
  const minTime = new Date(now.getTime() + minMinutesFromNow * 60 * 1000);
  const minHours = minTime.getHours();
  const minMinutes = minTime.getMinutes();
  const minTotalMinutes = minHours * 60 + minMinutes;

  return slots.filter((slot) => {
    const [hours, minutes] = slot.split(":").map(Number);
    const slotTotalMinutes = hours * 60 + minutes;
    return slotTotalMinutes >= minTotalMinutes;
  });
}
