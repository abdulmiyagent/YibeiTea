import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItemCustomization {
  sugarLevel?: number;
  iceLevel?: string;
  toppings?: string[];
  milkType?: string;
  size?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  customizations?: CartItemCustomization;
}

// Recent order for quick reorder feature
interface RecentOrderItem {
  productId: string;
  name: string;
  imageUrl?: string;
  price: number;
  customizations?: CartItemCustomization;
  orderedAt: number;
}

const RECENT_ORDERS_KEY = "yibei-recent-orders";
const MAX_RECENT_ORDERS = 5;

// Helper to save recent orders
function saveRecentOrder(item: Omit<CartItem, "id" | "quantity">) {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(RECENT_ORDERS_KEY);
    const orders: RecentOrderItem[] = stored ? JSON.parse(stored) : [];

    // Check if this exact product+customization already exists
    const existingIndex = orders.findIndex(
      (o) => o.productId === item.productId &&
        JSON.stringify(o.customizations) === JSON.stringify(item.customizations)
    );

    // Remove existing if found (we'll add it fresh to the front)
    if (existingIndex !== -1) {
      orders.splice(existingIndex, 1);
    }

    // Add new order to the front
    orders.unshift({
      productId: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      customizations: item.customizations,
      orderedAt: Date.now(),
    });

    // Keep only last N orders
    const trimmed = orders.slice(0, MAX_RECENT_ORDERS);
    localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore localStorage errors
  }
}

interface CartState {
  items: CartItem[];
  promoCode: string | null;
  discount: number;

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  applyPromoCode: (code: string, discount: number) => void;
  removePromoCode: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      discount: 0,

      addItem: (item) => {
        const id = `${item.productId}-${JSON.stringify(item.customizations || {})}`;

        // Save to recent orders for quick reorder feature
        saveRecentOrder({
          productId: item.productId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          customizations: item.customizations,
        });

        set((state) => {
          const existingItem = state.items.find((i) => i.id === id);

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + item.quantity } : i
              ),
            };
          }

          return {
            items: [...state.items, { ...item, id }],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => {
        set({ items: [], promoCode: null, discount: 0 });
      },

      applyPromoCode: (code, discount) => {
        set({ promoCode: code, discount });
      },

      removePromoCode: () => {
        set({ promoCode: null, discount: 0 });
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        return Math.max(0, subtotal - discount);
      },
    }),
    {
      name: "yibei-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
