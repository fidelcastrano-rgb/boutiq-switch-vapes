'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cartStore } from '@/lib/cart';

export function ProductCard({ product }: { product: any }) {
  return (
    <div className="bg-transparent rounded-2xl border border-border-soft overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col h-full">
      <div className="relative aspect-square w-full bg-secondary-bg overflow-hidden flex-shrink-0">
        <Image 
          src={product.image} 
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {product.tag && (
          <div className="absolute top-4 left-4 bg-primary text-main-bg text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {product.tag}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <Link href={`/products/${product.slug}`} className="block flex-grow">
          <h3 className="font-heading font-bold text-lg mb-2 text-text-primary group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{product.description}</p>
        </Link>
        <div className="mt-auto">
          <div className="flex gap-2 flex-wrap mb-4">
            {product.variants.slice(0, 2).map((variant: string) => (
              <span key={variant} className="text-xs bg-secondary-bg text-text-secondary px-2 py-1 rounded-md border border-border-soft">
                {variant}
              </span>
            ))}
            {product.variants.length > 2 && <span className="text-xs bg-secondary-bg text-text-secondary px-2 py-1 rounded-md border border-border-soft">+{product.variants.length - 2}</span>}
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="font-bold text-xl text-text-primary"><span className="text-sm font-normal text-text-secondary">from</span> ${product.price.toFixed(2)}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  cartStore.addItem({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    variant: product.variants[0] || 'Default',
                    quantity: 1
                  });
                }}
                className="bg-primary text-main-bg text-sm font-bold px-4 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                Add to Cart
              </button>
              <Link href={`/products/${product.slug}`} className="bg-secondary-bg text-text-primary text-sm font-medium px-4 py-2 rounded-lg hover:bg-border-soft transition-colors border border-border-soft">
                Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
