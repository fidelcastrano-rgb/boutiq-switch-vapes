import { notFound } from 'next/navigation';
import { BLOG_POSTS, PRODUCTS } from '@/lib/data';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, Lightbulb } from 'lucide-react';

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
       <Link href="/blog" className="text-primary font-medium hover:underline mb-8 inline-block">
         &larr; Back to all articles
       </Link>

       <div className="mb-8">
         <span className="text-xs font-bold uppercase tracking-widest text-primary mb-4 block">{post.category}</span>
         <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 text-text-primary leading-tight">{post.title}</h1>
         <div className="flex items-center gap-4 text-text-secondary text-sm border-b border-border-soft pb-8">
            <span>By {post.author}</span>
            <span>•</span>
            <span>Published on {post.date}</span>
         </div>
       </div>

       <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-secondary-bg mb-12">
          <Image src={post.image} alt={post.title} fill className="object-cover" priority />
       </div>

       {post.content ? (
         <article className="prose prose-slate max-w-none text-text-secondary leading-relaxed">
           <div dangerouslySetInnerHTML={{ __html: post.content }} />
         </article>
       ) : (
         <article className="prose prose-slate max-w-none">
          <p className="text-xl text-text-secondary leading-relaxed mb-8">
            {post.excerpt}
          </p>

          <h2 className="text-2xl font-heading font-bold text-text-primary mt-12 mb-6">Understanding the Boutiq Switch Difference</h2>
          <p className="text-text-secondary leading-relaxed mb-6">
            When looking for premium disposables in the US, authenticity and safety are paramount. The market is flooded with counterfeits, which is why sourcing directly from trusted wholesalers is critical. Our products undergo rigorous lab testing to ensure they are free from pesticides, heavy metals, and residual solvents.
          </p>

          <div className="my-8 border-l-4 border-orange bg-secondary-bg p-6 rounded-r-2xl">
            <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2">
              <Lightbulb size={18} className="text-orange" /> Pro Tip for Buyers
            </h4>
            <p className="text-text-secondary text-sm m-0">Always verify your product using the official scratch-off code on the packaging. Genuine Boutiq products will route to verified COA testing pages.</p>
          </div>

          <h3 className="text-xl font-heading font-bold text-text-primary mt-10 mb-4">Ordering Safely in 2024</h3>
          <p className="text-text-secondary leading-relaxed mb-6">
            We provide secure ordering channels with expedited shipping across all 50 states. Whether you are purchasing a single unit or a 50ct wholesale display box, safety and reliability are our top priorities.
          </p>

          <div className="my-8 border-l-4 border-red-500 bg-red-50 p-6 rounded-r-2xl">
            <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" /> Scam Warning
            </h4>
            <p className="text-red-800 text-sm m-0">Never purchase from unverified Instagram or Telegram vendors offering prices that are &quot;too good to be true.&quot; Authentic 2G hardware has a base manufacturing cost that makes ultra-cheap prices mathematically impossible without using dangerous, unverified oils.</p>
          </div>

          <p className="text-text-secondary leading-relaxed mb-6">
            Discover our complete product listing below and order securely via WhatsApp for the fastest processing times.
          </p>
       </article>

       )}

       <hr className="my-12 border-border-soft" />

       {/* Related Content */}
       <div className="bg-main-bg border border-border-soft rounded-3xl p-8 mb-12">
          <h3 className="font-heading font-bold text-2xl mb-6">Ready to order?</h3>
          <div className="flex flex-col sm:flex-row gap-4">
             <Link href="https://wa.me/1234567890" className="bg-[#25D366] text-main-bg px-8 py-4 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors text-center shadow-lg shadow-[#25D366]/20">
               Contact Sales on WhatsApp
             </Link>
             <Link href="/products" className="bg-transparent border border-border-soft text-text-primary px-8 py-4 rounded-xl font-bold hover:bg-secondary-bg transition-colors text-center">
               View All Products
             </Link>
          </div>
       </div>

       <div>
          <h3 className="font-bold text-lg mb-6">Related Products</h3>
          <div className="grid sm:grid-cols-2 gap-6">
             {PRODUCTS.slice(0, 2).map(product => (
               <Link key={product.id} href={`/products/${product.slug}`} className="flex items-center gap-4 bg-transparent border border-border-soft rounded-2xl p-4 hover:border-primary transition-colors group">
                  <div className="relative w-20 h-20 bg-secondary-bg rounded-xl overflow-hidden shrink-0">
                    <Image src={product.image} alt={product.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary group-hover:text-primary transition-colors mb-1 line-clamp-1">{product.name}</h4>
                    <span className="text-sm font-medium text-text-secondary">${product.price.toFixed(2)}</span>
                  </div>
               </Link>
             ))}
          </div>
       </div>
    </div>
  );
}
