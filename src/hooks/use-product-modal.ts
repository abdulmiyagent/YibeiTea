import { create } from "zustand";

interface ProductModalState {
  isOpen: boolean;
  productSlug: string | null;
  openModal: (slug: string) => void;
  closeModal: () => void;
}

export const useProductModal = create<ProductModalState>((set) => ({
  isOpen: false,
  productSlug: null,
  openModal: (slug) => set({ isOpen: true, productSlug: slug }),
  closeModal: () => set({ isOpen: false, productSlug: null }),
}));
