'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  tag: string;
  description: string;
  variants: string[];
  image: string;
  images: string[];
}

interface ProductsListProps {
  products: Product[];
  initialCategory?: string;
}

const CATEGORIES = [
  'All Products',
  'Boutiq Snack Packs',
  'Boutiq Carts',
  'Boutiq V3',
  'Boutiq V4',
  'Boutiq V5',
];

export function ProductsList({ products, initialCategory = 'All Products' }: ProductsListProps) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [prevInitialCategory, setPrevInitialCategory] = useState(initialCategory);

  if (initialCategory !== prevInitialCategory) {
    setPrevInitialCategory(initialCategory);
    setActiveCategory(initialCategory);
  }

  const filteredProducts = products.filter(product => {
    if (activeCategory === 'All Products') return true;
    return product.tag === activeCategory;
  });

  return (
    <div>
      {/* Dynamic Filter Bar */}
      <div className="sticky top-16 z-30 bg-main-bg/90 backdrop-blur-md py-4 border-b border-border-soft mb-8 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        {CATEGORIES.map(category => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-text-primary text-main-bg shadow-lg shadow-text-primary/10'
                  : 'bg-secondary-bg text-text-primary hover:bg-border-soft'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Animated Product Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id + '-' + product.tag}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">No products found in this category.</p>
        </div>
      )}
    </div>
  );
}
