"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/trpc";
import {
  Clock,
  ArrowLeft,
  Loader2,
  Calendar,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Helper function to generate time slots from opening hours
function generateTimeSlots(openTime: string, closeTime: string): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let currentHour = openHour;
  let currentMin = openMin;

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin - 30)) {
    slots.push(`${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`);
    currentMin += 30;
    if (currentMin >= 60) {
      currentMin = 0;
      currentHour++;
    }
  }

  return slots;
}

const DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function TimeSlotsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const utils = api.useUtils();

  // Selected date state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  // Fetch store settings
  const { data: storeSettings } = api.storeSettings.get.useQuery(undefined, {
    enabled: status === "authenticated" && isAdmin,
  });

  // Fetch slot availability for selected date
  const { data: slotAvailability, isLoading: isLoadingSlots } = api.timeSlots.getAvailability.useQuery(
    { date: selectedDate },
    { enabled: status === "authenticated" && isAdmin && !!selectedDate }
  );

  // Mutation to toggle slot
  const upsertOverride = api.timeSlots.upsertOverride.useMutation({
    onSuccess: () => {
      utils.timeSlots.getAvailability.invalidate({ date: selectedDate });
    },
  });

  const deleteOverride = api.timeSlots.deleteOverride.useMutation({
    onSuccess: () => {
      utils.timeSlots.getAvailability.invalidate({ date: selectedDate });
    },
  });

  const bulkDisable = api.timeSlots.bulkDisableSlots.useMutation({
    onSuccess: () => {
      utils.timeSlots.getAvailability.invalidate({ date: selectedDate });
    },
  });

  const enableAll = api.timeSlots.enableAllSlots.useMutation({
    onSuccess: () => {
      utils.timeSlots.getAvailability.invalidate({ date: selectedDate });
    },
  });

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    const date = new Date(selectedDate);
    const dayKey = DAY_KEYS[date.getDay()];

    const openingHours = storeSettings?.openingHours as Record<string, { open: string; close: string }> | undefined;
    const dayHours = openingHours?.[dayKey];

    if (dayHours) {
      return generateTimeSlots(dayHours.open, dayHours.close);
    }
    return generateTimeSlots("11:00", "20:00");
  }, [selectedDate, storeSettings]);

  // Calculate slot status
  const slotStatus = useMemo(() => {
    if (!slotAvailability) return {};

    const { defaultCapacity, orderCounts, overrides } = slotAvailability;
    const status: Record<string, {
      booked: number;
      capacity: number;
      isDisabled: boolean;
      hasOverride: boolean;
      reason?: string | null;
    }> = {};

    timeSlots.forEach((time) => {
      const override = overrides[time];
      const currentOrders = orderCounts[time] || 0;
      const capacity = override?.maxCapacity ?? defaultCapacity;
      const isDisabled = override?.isDisabled ?? false;

      status[time] = {
        booked: currentOrders,
        capacity,
        isDisabled,
        hasOverride: !!override,
        reason: override?.reason,
      };
    });

    return status;
  }, [slotAvailability, timeSlots]);

  // Navigation
  const goToPrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  // Toggle slot disabled state
  const toggleSlotDisabled = (time: string) => {
    const current = slotStatus[time];
    if (current?.isDisabled) {
      // Enable slot by deleting override
      deleteOverride.mutate({ date: selectedDate, time });
    } else {
      // Disable slot
      upsertOverride.mutate({ date: selectedDate, time, isDisabled: true, reason: "Handmatig uitgeschakeld" });
    }
  };

  // Update capacity for a slot
  const updateSlotCapacity = (time: string, capacity: number | null) => {
    if (capacity === null || capacity === slotAvailability?.defaultCapacity) {
      // Reset to default by deleting override if not disabled
      if (!slotStatus[time]?.isDisabled) {
        deleteOverride.mutate({ date: selectedDate, time });
      } else {
        upsertOverride.mutate({ date: selectedDate, time, maxCapacity: null });
      }
    } else {
      upsertOverride.mutate({ date: selectedDate, time, maxCapacity: capacity });
    }
  };

  // Disable all remaining slots
  const disableRemainingSlots = () => {
    const availableSlots = timeSlots.filter((time) => !slotStatus[time]?.isDisabled);
    if (availableSlots.length > 0) {
      bulkDisable.mutate({ date: selectedDate, times: availableSlots, reason: "Druk - alle slots uitgeschakeld" });
    }
  };

  // Enable all slots
  const enableAllSlots = () => {
    enableAll.mutate({ date: selectedDate });
  };

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/admin");
    return null;
  }

  const selectedDateObj = new Date(selectedDate);
  const dayName = DAYS[selectedDateObj.getDay()];
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const totalBooked = Object.values(slotStatus).reduce((sum, s) => sum + s.booked, 0);
  const totalCapacity = Object.values(slotStatus).reduce((sum, s) => s.isDisabled ? sum : sum + s.capacity, 0);
  const disabledCount = Object.values(slotStatus).filter((s) => s.isDisabled).length;

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/settings">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Terug naar instellingen
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="heading-1 flex items-center gap-3">
                <Clock className="h-8 w-8 text-tea-600" />
                Tijdsloten Beheer
              </h1>
              <p className="mt-2 text-muted-foreground">
                Beheer beschikbare tijdsloten per dag
              </p>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevDay}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-tea-600" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {!isToday && (
                  <Button variant="ghost" size="sm" onClick={goToToday}>
                    Vandaag
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {totalBooked}/{totalCapacity} geboekt
                </Badge>
                {disabledCount > 0 && (
                  <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700">
                    <Ban className="h-3 w-3" />
                    {disabledCount} uitgeschakeld
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="text-lg font-semibold capitalize">{dayName}</span>
              {isToday && (
                <Badge variant="secondary" className="ml-2 bg-tea-100 text-tea-700">
                  Vandaag
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={disableRemainingSlots}
            disabled={bulkDisable.isPending}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Ban className="mr-2 h-4 w-4" />
            Alles uitschakelen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={enableAllSlots}
            disabled={enableAll.isPending}
            className="text-green-600 hover:bg-green-50 hover:text-green-700"
          >
            <Check className="mr-2 h-4 w-4" />
            Alles inschakelen
          </Button>
        </div>

        {/* Time Slots Grid */}
        {isLoadingSlots ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {timeSlots.map((time) => {
              const status = slotStatus[time];
              const isFull = status && status.booked >= status.capacity;
              const isLimited = status && status.booked > 0 && status.capacity - status.booked <= 3;

              return (
                <Card
                  key={time}
                  className={cn(
                    "overflow-hidden transition-all",
                    status?.isDisabled && "opacity-60 bg-gray-50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-tea-600" />
                        <span className="text-xl font-bold">{time}</span>
                      </div>
                      <Button
                        variant={status?.isDisabled ? "outline" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          status?.isDisabled
                            ? "text-green-600 hover:bg-green-50"
                            : "text-red-500 hover:bg-red-50"
                        )}
                        onClick={() => toggleSlotDisabled(time)}
                        disabled={upsertOverride.isPending || deleteOverride.isPending}
                      >
                        {status?.isDisabled ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {status?.isDisabled ? (
                      <div className="mt-3 rounded-lg bg-red-100 p-2 text-center">
                        <span className="text-sm font-medium text-red-700">Uitgeschakeld</span>
                        {status.reason && (
                          <p className="text-xs text-red-600 mt-0.5">{status.reason}</p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Geboekt</span>
                            <span className={cn(
                              "font-semibold",
                              isFull ? "text-red-600" : isLimited ? "text-amber-600" : "text-green-600"
                            )}>
                              {status?.booked || 0} / {status?.capacity || slotAvailability?.defaultCapacity || 10}
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                isFull ? "bg-red-500" : isLimited ? "bg-amber-400" : "bg-green-500"
                              )}
                              style={{
                                width: `${Math.min(100, ((status?.booked || 0) / (status?.capacity || slotAvailability?.defaultCapacity || 10)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Capaciteit:</Label>
                          <select
                            value={status?.hasOverride && status?.capacity !== slotAvailability?.defaultCapacity
                              ? status.capacity
                              : "default"}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateSlotCapacity(time, value === "default" ? null : parseInt(value));
                            }}
                            className="h-7 rounded border bg-background px-2 text-sm"
                            disabled={upsertOverride.isPending}
                          >
                            <option value="default">Standaard ({slotAvailability?.defaultCapacity || 10})</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="15">15</option>
                            <option value="20">20</option>
                          </select>
                        </div>

                        {isFull && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            Volledig geboekt
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Beschikbaar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <span>Bijna vol (≤3 over)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span>Vol</span>
              </div>
              <div className="flex items-center gap-2">
                <Ban className="h-3 w-3 text-gray-500" />
                <span>Uitgeschakeld</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
