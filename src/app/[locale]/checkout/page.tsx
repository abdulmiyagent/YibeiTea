"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice } from "@/lib/utils";
import {
  User,
  Clock,
  CreditCard,
  ChevronRight,
  Check,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { id: "details", icon: User },
  { id: "pickup", icon: Clock },
  { id: "payment", icon: CreditCard },
];

const timeSlots = [
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
];

const paymentMethods = [
  { id: "bancontact", label: "Bancontact", icon: "💳" },
  { id: "ideal", label: "iDEAL", icon: "🏦" },
  { id: "creditcard", label: "Credit Card", icon: "💳" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getSubtotal, getTotal, discount, clearCart } = useCartStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    pickupDate: new Date().toISOString().split("T")[0],
    pickupTime: "12:00",
    paymentMethod: "bancontact",
    notes: "",
  });

  const subtotal = getSubtotal();
  const total = getTotal();

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Clear cart and redirect to confirmation
    clearCart();
    router.push("/order/confirmation?orderNumber=YBT-ABC123");
  };

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="mb-8">
          <h1 className="heading-1">{t("title")}</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    index < currentStep
                      ? "border-matcha-500 bg-matcha-500 text-white"
                      : index === currentStep
                      ? "border-tea-500 bg-tea-500 text-white"
                      : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-12 transition-colors md:w-24",
                      index < currentStep ? "bg-matcha-500" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <span className="text-sm font-medium">
              {t(`steps.${steps[currentStep].id}`)}
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Contact Details */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h2 className="heading-3">{t("contact.title")}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("contact.name")}</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            updateFormData("name", e.target.value)
                          }
                          placeholder="Jan Janssen"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("contact.phone")}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            updateFormData("phone", e.target.value)
                          }
                          placeholder="0471 23 45 67"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("contact.email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          updateFormData("email", e.target.value)
                        }
                        placeholder="jan@email.be"
                      />
                    </div>
                  </div>
                )}

                {/* Step 2: Pickup Time */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h2 className="heading-3">{t("pickup.title")}</h2>
                    <div className="space-y-2">
                      <Label htmlFor="date">{t("pickup.selectDate")}</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.pickupDate}
                        onChange={(e) =>
                          updateFormData("pickupDate", e.target.value)
                        }
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("pickup.selectTime")}</Label>
                      <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={
                              formData.pickupTime === time ? "tea" : "outline"
                            }
                            size="sm"
                            onClick={() => updateFormData("pickupTime", time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">{t("notes.label")}</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          updateFormData("notes", e.target.value)
                        }
                        placeholder={t("notes.placeholder")}
                      />
                    </div>
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h2 className="heading-3">{t("payment.title")}</h2>
                    <div className="grid gap-3 md:grid-cols-2">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                            formData.paymentMethod === method.id
                              ? "border-tea-500 bg-tea-50"
                              : "border-muted hover:border-tea-300"
                          )}
                          onClick={() =>
                            updateFormData("paymentMethod", method.id)
                          }
                        >
                          <span className="text-2xl">{method.icon}</span>
                          <span className="font-medium">{method.label}</span>
                          {formData.paymentMethod === method.id && (
                            <Check className="ml-auto h-5 w-5 text-tea-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("steps.details") === steps[currentStep].id
                      ? "Terug"
                      : t(`steps.${steps[currentStep - 1]?.id || "details"}`)}
                  </Button>

                  {currentStep < steps.length - 1 ? (
                    <Button variant="tea" onClick={handleNext}>
                      {t(`steps.${steps[currentStep + 1].id}`)}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="tea"
                      onClick={handleSubmit}
                      disabled={isProcessing}
                    >
                      {isProcessing ? t("processing") : t("placeOrder")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Besteloverzicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotaal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-matcha-600">
                      <span>Korting</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Totaal</span>
                  <span className="text-tea-600">{formatPrice(total)}</span>
                </div>

                {/* Pickup Info */}
                {formData.pickupTime && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-tea-600" />
                      <span>
                        Afhalen: {formData.pickupDate} om {formData.pickupTime}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
