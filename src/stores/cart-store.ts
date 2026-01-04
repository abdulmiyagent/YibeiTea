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
