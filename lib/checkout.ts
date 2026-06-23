import { PRODUCTS } from './data';

// Simplified client-side cart logic representation
export type CartItem = {
  productId: string;
  variant: string;
  quantity: number;
  price: number;
};

export const calculateShipping = (subtotal: number, shippingMethod: string, isInternational: boolean) => {
  if (subtotal >= 500) return 0;
  if (isInternational) return 55;
  if (shippingMethod === 'express') return 60;
  return 20; // standard
};

export const calculateCryptoDiscount = (subtotal: number, paymentMethod: string) => {
  if (paymentMethod === 'crypto') {
    return subtotal * 0.10; // 10% off
  }
  return 0;
};

export const validatePaymentMethod = (paymentMethod: string, subtotal: number) => {
  if (paymentMethod !== 'crypto' && subtotal < 150) {
    return "Minimum order amount for this payment method is $150.";
  }
  return null;
}
