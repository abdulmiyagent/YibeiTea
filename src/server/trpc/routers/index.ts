import { router } from "../trpc";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { usersRouter } from "./users";
import { twoFactorRouter } from "./two-factor";
import { categoriesRouter } from "./categories";
import { toppingsRouter } from "./toppings";

export const appRouter = router({
  products: productsRouter,
  orders: ordersRouter,
  users: usersRouter,
  twoFactor: twoFactorRouter,
  categories: categoriesRouter,
  toppings: toppingsRouter,
});

export type AppRouter = typeof appRouter;
