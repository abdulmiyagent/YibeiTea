import { router } from "../trpc";
import { productsRouter } from "./products";
import { ordersRouter } from "./orders";
import { usersRouter } from "./users";

export const appRouter = router({
  products: productsRouter,
  orders: ordersRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
