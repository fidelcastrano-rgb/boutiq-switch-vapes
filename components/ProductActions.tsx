'use client';

import { useState } from 'react';
import { cartStore } from '@/lib/cart';
import { ShoppingBag, Check } from 'lucide-react';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    variants: string[];
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0] || 'Default');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    cartStore.addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      variant: selectedVariant,
      quantity: quantity
    });
    
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Variants Selection Container */}
      <div>
        <h3 className="font-heading font-semibold text-xs tracking-wider uppercase text-text-secondary mb-3">Select Strain / Flavor:</h3>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((v) => (
            <button
              key={v}
              type="button"
              id={`variant-${v.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => setSelectedVariant(v)}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono transition-all border ${
                selectedVariant === v
                  ? 'border-primary bg-primary/10 text-primary shadow-sm font-bold'
                  : 'bg-secondary-bg border-border-soft text-text-secondary hover:border-text-secondary hover:text-text-primary'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity & Add to Cart button */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch pt-6 border-t border-border-soft/60">
        <div className="flex items-center border border-border-soft rounded-2xl bg-secondary-bg h-14 px-2 select-none min-w-[130px] justify-between">
          <button
            type="button"
            id="qty-decrement"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="text-text-secondary hover:text-text-primary font-bold text-xl px-2 w-8 h-8 rounded-lg hover:bg-border-soft/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            -
          </button>
          <span className="font-mono font-bold text-base text-text-primary w-8 text-center">{quantity}</span>
          <button
            type="button"
            id="qty-increment"
            onClick={() => setQuantity(q => q + 1)}
            className="text-text-secondary hover:text-text-primary font-bold text-xl px-2 w-8 h-8 rounded-lg hover:bg-border-soft/20 transition-colors flex items-center justify-center cursor-pointer"
          >
            +
          </button>
        </div>

        <button
          type="button"
          id="add-to-cart-btn"
          onClick={handleAddToCart}
          className={`flex-1 flex gap-3 items-center justify-center rounded-2xl font-bold text-base h-14 transition-all duration-300 cursor-pointer ${
            added
              ? 'bg-success text-main-bg shadow-lg shadow-success/10'
              : 'bg-primary text-main-bg hover:bg-accent hover:-translate-y-0.5 shadow-lg shadow-primary/20'
          }`}
        >
          {added ? (
            <>
              <Check className="w-5 h-5 shrink-0" /> Added to Cart!
            </>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 shrink-0" /> Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
