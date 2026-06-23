import { PRODUCTS } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldAlert, Info, MessageSquare, Truck, ShieldCheck, Mail, ShoppingBag } from 'lucide-react';
import { ProductActions } from '@/components/ProductActions';


export function generateStaticParams() {
  return PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const product = PRODUCTS.find((p) => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  // Pre-fill WhatsApp message
  const waMessage = encodeURIComponent(`Hi, I'm interested in ordering the ${product.name} (Price: $${product.price.toFixed(2)}). Please send me purchasing details.`);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="mb-8 text-sm text-text-secondary flex items-center gap-2">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary">Products</Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        {/* Left: Images */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-secondary-bg border border-border-soft">
             {product.tag && (
                <div className="absolute top-6 left-6 z-10 bg-primary text-main-bg text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                  {product.tag}
                </div>
              )}
            <Image 
              src={product.image} 
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {product.images?.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-secondary-bg border border-border-soft cursor-pointer hover:border-primary transition-colors">
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Premium Disposable</span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-text-primary">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-text-primary">
              <span className="text-xl text-text-secondary font-normal">from</span> ${product.price.toFixed(2)}
            </span>
            <span className="bg-success/10 text-success text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span> In Stock
            </span>
          </div>

          <p className="text-lg text-text-secondary mb-8 leading-relaxed">
            {product.description}
          </p>

          {/* Product Interactive Actions */}
          <div className="mb-8 p-6 bg-secondary-bg/30 rounded-3xl border border-border-soft/60">
            <ProductActions product={product} />
          </div>

          {/* Alternative Quick Channels */}
          <div className="grid grid-cols-2 gap-3 mb-10">
            <Link 
              href={`https://wa.me/1234567890?text=${waMessage}`}
              target="_blank"
              className="bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#20ba5a] transition-all text-center"
            >
              <MessageSquare size={16} />
              WhatsApp Orders
            </Link>
            <Link 
              href="/checkout"
              className="bg-text-primary text-main-bg py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-text-primary/95 transition-all text-center"
            >
              <ShoppingBag size={16} />
              Web Checkout
            </Link>
          </div>

          {/* Info Boxes */}
          <div className="flex flex-col gap-4">
            <div className="border-l-4 border-orange bg-secondary-bg p-5 rounded-r-2xl">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <Info size={16} className="text-orange" /> How Ordering Works
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                Click ordering buttons above to contact sales. Invoices provided for Crypto or Card payments. Standard Delivery (3-5 days) or Express 24h available.
              </p>
            </div>
            
            <div className="border-l-4 border-primary bg-secondary-bg p-5 rounded-r-2xl">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" /> Verified Safety Protocol
              </h4>
              <p className="text-sm text-text-secondary leading-relaxed">
                All products come with a scratch-off COA (Certificate of Analysis) QR code verifying zero pesticides and heavy metals.
              </p>
              <button className="text-primary text-sm font-bold mt-2 hover:underline">View Verification Guide</button>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Related Products Grid Could Go Here */}
    </div>
  );
}
