import { router } from "../trpc";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { usersRouter } from "./users";
import { twoFactorRouter } from "./two-factor";
import { categoriesRouter } from "./categories";
import { toppingsRouter } from "./toppings";
import { customizationsRouter } from "./customizations";
import { rewardsRouter } from "./rewards";
import { analyticsRouter } from "./analytics";
import { paymentsRouter } from "./payments";
import { promoCodesRouter } from "./promoCodes";
import { storeSettingsRouter } from "./storeSettings";
import { newsletterRouter } from "./newsletter";

export const appRouter = router({
  products: productsRouter,
  orders: ordersRouter,
  users: usersRouter,
  twoFactor: twoFactorRouter,
  categories: categoriesRouter,
  toppings: toppingsRouter,
  customizations: customizationsRouter,
  rewards: rewardsRouter,
  analytics: analyticsRouter,
  payments: paymentsRouter,
  promoCodes: promoCodesRouter,
  storeSettings: storeSettingsRouter,
  newsletter: newsletterRouter,
});

export type AppRouter = typeof appRouter;
