import { PRODUCTS } from '@/lib/data';
import { ProductsList } from '@/components/ProductsList';

export const metadata = {
  title: 'Products | Boutiq Switch International',
  description: 'Browse our full catalog of Boutiq Switch and V5 disposables.',
};

interface PageProps {
  searchParams: any;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const initialCategory = resolvedParams?.category || 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4" id="all-products-main-title">All Products</h1>
        <p className="text-text-secondary text-lg max-w-2xl" id="all-products-main-subtitle">
          Verified lab results. Premium medical grade hardware. Shop retail or wholesale bundles with fast US delivery.
        </p>
      </div>

      <ProductsList products={PRODUCTS} initialCategory={initialCategory} />
    </div>
  );
}
