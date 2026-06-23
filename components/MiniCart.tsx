'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cartStore, CartItem } from '@/lib/cart';
import Link from 'next/link';
import Image from 'next/image';

export function MiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      return [...cartStore.getItems()];
    }
    return [];
  });
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    const unsubscribe = cartStore.subscribe(() => {
      setItems([...cartStore.getItems()]);
    });

    const handleOpen = () => {
      setIsOpen(true);
      setPulse(true);
      setJustAdded(true);
      setTimeout(() => setPulse(false), 500);
      setTimeout(() => setJustAdded(false), 3000);
    };

    window.addEventListener('cart-opened', handleOpen);

    return () => {
      unsubscribe();
      window.removeEventListener('cart-opened', handleOpen);
    };
  }, []);

  if (!mounted) return null;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Compute default values that matches cart checkout page logic
  const isNorthAmerica = true; // Default assumption for the mini-cart
  let shippingCost = 20;
  if (subtotal >= 500 || subtotal === 0) {
    shippingCost = 0;
  }
  
  // Example dummy discount - typically you'd fetch this from the actual cart context or store if applied
  const couponDiscount = 0;
  const cryptoDiscount = 0; // Assuming not selected yet
  
  const grandTotal = Math.max(0, subtotal - (couponDiscount + cryptoDiscount) + shippingCost);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-[60] bg-primary text-main-bg p-4 rounded-full shadow-2xl flex items-center gap-3 hover:bg-accent transition-colors border border-border-soft/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={pulse ? { scale: [1, 1.2, 1] } : {}}
        onClick={() => setIsOpen(true)}
        aria-label="Open Cart"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className="absolute -top-3 -right-3 bg-main-bg text-primary text-[11px] font-bold w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-primary">
              {totalItems}
            </span>
          )}
        </div>
        {totalItems > 0 && (
          <div className="hidden sm:block font-bold pr-1">
            ${subtotal.toFixed(2)}
          </div>
        )}
      </motion.button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-main-bg/80 backdrop-blur-sm z-[70]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%', y: 0 }}
              animate={{ x: 0, y: 0 }}
              exit={{ x: '100%', y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-secondary-bg border-l border-border-soft z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border-soft flex flex-col gap-4 bg-main-bg sticky top-0 z-10 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-heading font-bold flex items-center gap-3">
                    <ShoppingCart className="text-primary" /> Your Cart
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-secondary-bg rounded-full transition-colors text-text-secondary hover:text-primary"
                    aria-label="Close Cart"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <AnimatePresence>
                  {justAdded && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: -16 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                      exit={{ opacity: 0, height: 0, marginTop: -16 }}
                      className="bg-primary/10 border border-primary/30 text-primary py-2 px-3 rounded-lg text-sm font-bold flex items-center gap-2 justify-center"
                    >
                      <ShoppingCart size={16} /> Added to Cart!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-4 pt-10">
                    <ShoppingCart size={64} className="opacity-20" />
                    <p className="text-lg font-medium">Your cart is empty.</p>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="text-primary font-bold hover:underline transition-colors p-2"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {items.map((item) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={item.id}
                          className="flex gap-4 bg-main-bg p-4 rounded-2xl border border-border-soft relative group hover:border-primary/50 transition-colors"
                        >
                          <div className="relative w-20 h-20 bg-secondary-bg rounded-xl overflow-hidden shrink-0 border border-border-soft shadow-inner">
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <Link onClick={() => setIsOpen(false)} href={`/products/${item.id}`} className="font-bold text-text-primary hover:text-primary transition-colors text-sm line-clamp-2 md:text-base pr-4">
                                  {item.name}
                                </Link>
                                {item.variant && (
                                  <div className="text-text-secondary text-xs mt-0.5 line-clamp-1">{item.variant}</div>
                                )}
                                <div className="text-primary font-bold mt-1 text-sm">${item.price.toFixed(2)}</div>
                              </div>
                              <button
                                onClick={() => cartStore.removeItem(item.id, item.variant || '')}
                                className="text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors p-1.5 rounded-lg absolute top-3 right-3"
                                aria-label="Remove item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-3">
                              <div className="flex items-center gap-1 bg-secondary-bg rounded-lg border border-border-soft p-1">
                                <button
                                  onClick={() => cartStore.updateQuantity(item.id, item.variant || '', Math.max(1, item.quantity - 1))}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-main-bg hover:text-primary rounded-md transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center text-sm font-bold select-none">{item.quantity}</span>
                                <button
                                  onClick={() => cartStore.updateQuantity(item.id, item.variant || '', item.quantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center hover:bg-main-bg hover:text-primary rounded-md transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <div className="font-bold text-text-primary ml-auto text-sm">
                                ${(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-border-soft p-6 bg-main-bg space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-10">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-text-secondary">
                      <span>Subtotal</span>
                      <span className="text-text-primary font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary">
                      <span>Shipping Estimate</span>
                      <span className="text-text-primary font-medium">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end border-t border-border-soft pt-4 mb-6">
                    <span className="text-text-secondary text-base">Grand Total</span>
                    <span className="text-3xl font-heading font-bold text-primary">${grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="bg-primary text-main-bg w-full py-4 rounded-xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Proceed to Checkout <ArrowRight size={18} />
                    </Link>
                    <Link
                      href="/checkout"
                      onClick={() => setIsOpen(false)}
                      className="bg-secondary-bg border border-border-soft text-text-primary w-full py-3.5 text-sm rounded-xl font-bold hover:bg-main-bg transition-colors flex items-center justify-center"
                    >
                      View Full Cart
                    </Link>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
