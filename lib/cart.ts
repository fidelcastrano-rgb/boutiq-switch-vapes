'use client';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  variant: string;
  quantity: number;
}

let cartItems: CartItem[] = [];
let listeners: (() => void)[] = [];

// Lazy load cart on the client side
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('boutiq_cart');
    if (saved) {
      cartItems = JSON.parse(saved);
    }
  } catch (err) {
    // Ignored
  }
}

// Pre-fill with a couple of premium items if empty to avoid frustration of an empty cart
function checkDefaultItems() {
  if (cartItems.length === 0) {
    cartItems = [
      {
        id: 'boutiq-switch-v4-strawberry-haze-watermelon-z-2g-disposable-vape-official-boutiq-switch',
        name: 'Boutiq Switch V4 (Strawberry Haze x Watermelon Z)',
        price: 35.00,
        image: 'https://picsum.photos/seed/v4straw/400/400',
        variant: 'Strawberry Haze x Watermelon Z',
        quantity: 3
      },
      {
        id: 'boutiq-snack-pack-live-diamonds-2-5g-minis-apple-fritter-infused-w-trufflez',
        name: 'Boutiq Snack Pack 2.5G Minis (Apple Fritter x Trufflez)',
        price: 55.00,
        image: 'https://picsum.photos/seed/snackapple/400/400',
        variant: 'Apple Fritter infused w/ Trufflez',
        quantity: 2
      }
    ];
    saveCart();
  }
}

function saveCart() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('boutiq_cart', JSON.stringify(cartItems));
    } catch (e) {
      // Ignored
    }
  }
  listeners.forEach((l) => l());
}

export const cartStore = {
  getItems() {
    if (cartItems.length === 0 && typeof window !== 'undefined') {
      checkDefaultItems();
    }
    return cartItems;
  },
  
  addItem(item: Omit<CartItem, 'quantity'> & { quantity?: number }) {
    const existing = cartItems.find((i) => i.id === item.id && i.variant === item.variant);
    const qty = item.quantity || 1;
    if (existing) {
      existing.quantity += qty;
    } else {
      cartItems.push({ ...item, quantity: qty });
    }
    saveCart();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart-opened'));
    }
  },
  
  updateQuantity(id: string, variant: string, quantity: number) {
    const item = cartItems.find((i) => i.id === id && i.variant === variant);
    if (item) {
      item.quantity = Math.max(1, quantity);
      saveCart();
    }
  },
  
  removeItem(id: string, variant: string) {
    cartItems = cartItems.filter((i) => !(i.id === id && i.variant === variant));
    saveCart();
  },
  
  clearCart() {
    cartItems = [];
    saveCart();
  },
  
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }
};
