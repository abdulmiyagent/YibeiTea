import { router } from "../trpc";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { usersRouter } from "./users";
import { twoFactorRouter } from "./two-factor";
import { categoriesRouter } from "./categories";
import { toppingsRouter } from "./toppings";
import { customizationsRouter } from "./customizations";

export const appRouter = router({
  products: productsRouter,
  orders: ordersRouter,
  users: usersRouter,
  twoFactor: twoFactorRouter,
  categories: categoriesRouter,
  toppings: toppingsRouter,
  customizations: customizationsRouter,
});

export type AppRouter = typeof appRouter;
