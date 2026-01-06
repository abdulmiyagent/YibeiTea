"use client";

import { useState, useMemo } from "react";
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
import { api } from "@/lib/trpc";
import {
  User,
  Clock,
  CreditCard,
  ChevronRight,
  Check,
  ArrowLeft,
  AlertCircle,
  Gift,
  Crown,
  X,
  Tag,
  Loader2,
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
  const { data: session, status: sessionStatus } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();
  const isLoggedIn = sessionStatus === "authenticated";

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
  } | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);

  // Fetch user's loyalty info (only if logged in)
  const { data: loyaltyInfo } = api.users.getLoyaltyInfo.useQuery(
    undefined,
    { enabled: isLoggedIn }
  );

  // Fetch available rewards (only if logged in)
  const { data: rewards } = api.rewards.getAll.useQuery(
    { locale: "nl" },
    { enabled: isLoggedIn }
  );

  const createPaymentMutation = api.payments.createPayment.useMutation({
    onSuccess: (data) => {
      clearCart();
      // Redirect to Mollie checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError("Er is een fout opgetreden bij het starten van de betaling.");
        setIsProcessing(false);
      }
    },
    onError: (err) => {
      setError(err.message || "Er is een fout opgetreden bij het starten van de betaling.");
      setIsProcessing(false);
    },
  });

  const createOrderMutation = api.orders.create.useMutation({
    onSuccess: (order) => {
      // After order is created, initiate payment
      createPaymentMutation.mutate({
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount: Number(order.total),
      });
    },
    onError: (err) => {
      setError(err.message || "Er is een fout opgetreden bij het plaatsen van je bestelling.");
      setIsProcessing(false);
    },
  });

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
  const userPoints = loyaltyInfo?.loyaltyPoints ?? 0;

  // Filter rewards that user can afford
  const affordableRewards = useMemo(() => {
    if (!rewards) return [];
    return rewards.filter((reward) => userPoints >= reward.pointsCost);
  }, [rewards, userPoints]);

  // Get selected reward details
  const selectedReward = useMemo(() => {
    if (!selectedRewardId || !rewards) return null;
    return rewards.find((r) => r.id === selectedRewardId) || null;
  }, [selectedRewardId, rewards]);

  // Calculate discount from selected reward
  const rewardDiscount = useMemo(() => {
    if (!selectedReward) return 0;
    const discountValue = selectedReward.rewardValue;
    // Ensure discount doesn't exceed subtotal
    return Math.min(discountValue, subtotal);
  }, [selectedReward, subtotal]);

  // Calculate promo code discount
  const promoDiscount = appliedPromoCode?.discountAmount ?? 0;

  // Total discount (reward + promo code)
  const totalDiscount = Math.min(rewardDiscount + promoDiscount, subtotal);
  const total = Math.max(0, subtotal - totalDiscount);
  const pointsToEarn = Math.floor(total * 10);

  // Promo code validation
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setPromoCodeError(null);

    try {
      const result = await new Promise<{
        code: string;
        discountType: string;
        discountValue: number;
        discountAmount: number;
      }>((resolve, reject) => {
        // Use utils to call the validate query
        fetch(`/api/trpc/promoCodes.validate?input=${encodeURIComponent(JSON.stringify({ code: promoCodeInput, orderAmount: subtotal }))}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.result?.data) {
              resolve(data.result.data);
            } else if (data.error) {
              reject(new Error(data.error.message || "Ongeldige promotiecode"));
            } else {
              reject(new Error("Ongeldige promotiecode"));
            }
          })
          .catch(() => reject(new Error("Er is een fout opgetreden")));
      });

      setAppliedPromoCode(result);
      setPromoCodeInput("");
    } catch (err) {
      setPromoCodeError(err instanceof Error ? err.message : "Ongeldige promotiecode");
    }
  };

  const handleRemovePromoCode = () => {
    setAppliedPromoCode(null);
    setPromoCodeError(null);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.name.trim()) {
        errors.name = t("validation.nameRequired") || "Naam is verplicht";
      }
      if (!formData.email.trim()) {
        errors.email = t("validation.emailRequired") || "E-mail is verplicht";
      } else if (!validateEmail(formData.email)) {
        errors.email = t("validation.emailInvalid") || "Ongeldig e-mailadres";
      }
    }

    if (step === 1) {
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const now = new Date();
      if (pickupDateTime < now) {
        errors.pickupTime = t("validation.pickupTimeInvalid") || "Kies een toekomstige afhaaltijd";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1)) {
      setError(t("validation.fixErrors") || "Corrigeer de fouten voordat je bestelt");
      return;
    }

    setIsProcessing(true);
    setError(null);

    const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}:00`;

    createOrderMutation.mutate({
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price,
        customizations: item.customizations || undefined,
      })),
      customerName: formData.name.trim(),
      customerEmail: formData.email.trim(),
      customerPhone: formData.phone.trim() || undefined,
      pickupTime: pickupDateTime,
      notes: formData.notes.trim() || undefined,
      rewardId: selectedRewardId || undefined,
      promoCode: appliedPromoCode?.code || undefined,
    });
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
                        <Label htmlFor="name">{t("contact.name")} *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateFormData("name", e.target.value)}
                          placeholder="Jan Janssen"
                          className={fieldErrors.name ? "border-red-500" : ""}
                        />
                        {fieldErrors.name && (
                          <p className="text-xs text-red-500">{fieldErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t("contact.phone")}</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => updateFormData("phone", e.target.value)}
                          placeholder="0471 23 45 67"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t("contact.email")} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData("email", e.target.value)}
                        placeholder="jan@email.be"
                        className={fieldErrors.email ? "border-red-500" : ""}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-red-500">{fieldErrors.email}</p>
                      )}
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
                        onChange={(e) => updateFormData("pickupDate", e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("pickup.selectTime")}</Label>
                      <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            variant={formData.pickupTime === time ? "tea" : "outline"}
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
                        onChange={(e) => updateFormData("notes", e.target.value)}
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
                          onClick={() => updateFormData("paymentMethod", method.id)}
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

                {/* Error Message */}
                {error && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
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

                {/* Rewards Section - Only show for logged in users */}
                {isLoggedIn && (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-tea-600" />
                          <span className="text-sm font-medium">Jouw punten</span>
                        </div>
                        <Badge variant="secondary">{userPoints} pts</Badge>
                      </div>

                      {affordableRewards.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Gebruik punten voor korting:
                          </p>
                          {affordableRewards.map((reward) => (
                            <button
                              key={reward.id}
                              onClick={() =>
                                setSelectedRewardId(
                                  selectedRewardId === reward.id ? null : reward.id
                                )
                              }
                              className={cn(
                                "flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors",
                                selectedRewardId === reward.id
                                  ? "border-matcha-500 bg-matcha-50"
                                  : "border-muted hover:border-tea-300"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Gift className="h-4 w-4 text-matcha-600" />
                                <div>
                                  <p className="font-medium">{reward.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {reward.pointsCost} punten
                                  </p>
                                </div>
                              </div>
                              {selectedRewardId === reward.id ? (
                                <X className="h-4 w-4 text-matcha-600" />
                              ) : (
                                <span className="text-xs text-matcha-600">
                                  -{formatPrice(reward.rewardValue)}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {affordableRewards.length === 0 && rewards && rewards.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Nog {rewards[0].pointsCost - userPoints} punten nodig voor je eerste beloning
                        </p>
                      )}
                    </div>

                    <Separator />
                  </>
                )}

                {/* Promo Code */}
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Promotiecode
                  </p>
                  {appliedPromoCode ? (
                    <div className="flex items-center justify-between rounded-lg border border-matcha-300 bg-matcha-50 p-3">
                      <div>
                        <p className="font-mono font-medium text-matcha-700">{appliedPromoCode.code}</p>
                        <p className="text-xs text-matcha-600">
                          {appliedPromoCode.discountType === "PERCENTAGE"
                            ? `${appliedPromoCode.discountValue}% korting`
                            : `€${appliedPromoCode.discountValue.toFixed(2)} korting`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromoCode}
                        className="text-matcha-600 hover:text-matcha-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          setPromoCodeError(null);
                        }}
                        placeholder="CODE"
                        className="flex-1 font-mono"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleApplyPromoCode}
                        disabled={!promoCodeInput.trim()}
                      >
                        Toepassen
                      </Button>
                    </div>
                  )}
                  {promoCodeError && (
                    <p className="text-xs text-red-500">{promoCodeError}</p>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotaal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {promoDiscount > 0 && appliedPromoCode && (
                    <div className="flex justify-between text-sm text-matcha-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {appliedPromoCode.code}
                      </span>
                      <span>-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  {rewardDiscount > 0 && selectedReward && (
                    <div className="flex justify-between text-sm text-matcha-600">
                      <span className="flex items-center gap-1">
                        <Gift className="h-3 w-3" />
                        {selectedReward.name}
                      </span>
                      <span>-{formatPrice(rewardDiscount)}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Totaal</span>
                  <span className="text-tea-600">{formatPrice(total)}</span>
                </div>

                {/* Points to earn */}
                {isLoggedIn && pointsToEarn > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-matcha-50 p-3 text-sm">
                    <span className="text-matcha-700">Je verdient</span>
                    <span className="font-medium text-matcha-700">+{pointsToEarn} punten</span>
                  </div>
                )}

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
