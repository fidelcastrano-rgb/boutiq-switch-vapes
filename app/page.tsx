import Image from 'next/image';
import Link from 'next/link';
import { PRODUCTS, FAQS } from '@/lib/data';
import { ProductCard } from '@/components/ProductCard';
import { Shield, Zap, TrendingUp, Sparkles, Droplets, CheckCircle2, ChevronDown, Rocket, Fingerprint, BatteryCharging, ArrowRight, Award, Lock, Truck, Bitcoin } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Boutiq Switch | Authentic 2G Boutiq Carts & V5 Disposables',
  description: 'Shop the authentic Boutiq Switch collection. From the iconic Boutiq Carts to the latest Boutiq V5 and V4 2G disposables. Premium vape products with verified COAs.',
  keywords: 'Boutiq Switch, Boutiq Carts, Boutiq V5, Boutiq V4, premium vape products, disposable vape devices',
  openGraph: {
    title: 'Boutiq Switch | Authentic 2G Boutiq Carts & V5 Disposables',
    description: 'Shop the authentic Boutiq Switch collection. From the iconic Boutiq Carts to the latest Boutiq V5 and V4 2G disposables.',
    url: 'https://boutiqswitchvapes.us',
    siteName: 'Boutiq Switch International',
    images: [{ url: '/img.webp', width: 1200, height: 630 }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boutiq Switch | Authentic 2G Boutiq Carts & V5 Disposables',
    description: 'Shop the authentic Boutiq Switch collection. Premium vape products with verified COAs.',
    images: ['/img.webp'],
  },
  alternates: {
    canonical: 'https://boutiqswitchvapes.us',
  }
};

// Pure deterministic selection & shuffling
function getShowcasedProducts(allProducts: typeof PRODUCTS): typeof PRODUCTS {
  const productsWithWeights = allProducts.map((p, index) => {
    let hash = 0;
    for (let i = 0; i < p.id.length; i++) {
      hash = (hash * 31 + p.id.charCodeAt(i)) & 0xffffffff;
    }
    const weight = Math.abs((hash ^ index) % 1000);
    return { product: p, weight };
  });

  const sortedProducts = [...productsWithWeights]
    .sort((a, b) => a.weight - b.weight)
    .map(pw => pw.product);

  const categories = Array.from(new Set(sortedProducts.map(p => p.tag)));
  const preSelected: typeof PRODUCTS = [];
  const remaining = [...sortedProducts];

  categories.forEach(cat => {
    const catProducts = remaining.filter(p => p.tag === cat);
    if (catProducts.length > 0) {
      preSelected.push(catProducts[0]);
      const idx = remaining.findIndex(p => p.id === catProducts[0].id);
      if (idx !== -1) {
        remaining.splice(idx, 1);
      }
    }
  });

  const needed = 12 - preSelected.length;
  const extra = remaining.slice(0, needed);

  return [...preSelected, ...extra].sort((a, b) => {
    const wEa = (a.id.charCodeAt(0) * 17) % 10;
    const wEb = (b.id.charCodeAt(0) * 17) % 10;
    return wEa - wEb;
  });
}

// Schemas
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Boutiq Switch International",
  "url": "https://boutiqswitchvapes.us",
  "logo": "https://boutiqswitchvapes.us/img.webp",
  "description": "Premium wholesaler and retailer of Boutiq Switch, Boutiq Carts, Boutiq V5, and Boutiq V4 devices."
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Boutiq Switch Vapes",
  "url": "https://boutiqswitchvapes.us",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://boutiqswitchvapes.us/products?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [{
    "@type": "ListItem",
    "position": 1,
    "name": "Home",
    "item": "https://boutiqswitchvapes.us"
  }]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQS.slice(0,10).map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export default function Home() {
  const showcasedProducts = getShowcasedProducts(PRODUCTS);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="flex flex-col gap-20 pb-20 overflow-hidden">
        
        {/* Promotion Banner */}
        <div className="bg-primary/10 border-b border-primary/20 text-center py-2 px-4 z-40 relative">
          <p className="text-secondary-bg font-semibold text-sm flex flex-col sm:flex-row justify-center items-center gap-2 md:gap-6">
            <span className="text-primary tracking-wide">FREE SHIPPING OVER $500</span>
            <span className="hidden sm:block text-primary/50">•</span>
            <span className="text-primary tracking-wide">10% OFF CRYPTO ORDERS</span>
            <span className="hidden sm:block text-primary/50">•</span>
            <span className="text-primary tracking-wide">USE CODE: WELCOME10</span>
          </p>
        </div>

        {/* SECTION 1: Hero Area */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-4 md:pt-10">
          <div className="absolute top-0 left-0 w-full overflow-hidden flex justify-center -z-10 select-none pointer-events-none opacity-[0.02]">
            <span className="text-[120px] sm:text-[180px] md:text-[250px] lg:text-[320px] font-heading font-bold text-text-primary whitespace-nowrap leading-none tracking-tighter">
              SWITCH
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight text-text-primary leading-[1.1]">
                The Authentic <br className="hidden md:block"/>
                <span className="text-primary">Boutiq Switch</span> Experience.
              </h1>
              <div className="text-lg md:text-xl text-text-secondary max-w-lg leading-relaxed space-y-4">
                <p>
                  Welcome to the ultimate destination for premium vape products. The <strong className="text-text-primary">Boutiq Switch</strong> represents the pinnacle of modern disposable vape devices, offering an unprecedented 2-in-1 dual flavor experience engineered for purity.
                </p>
                <p>
                  We are the United States&apos; most trusted source for verified, lab-tested <strong className="text-text-primary">Boutiq Carts</strong>. Whether you are searching for the classic <strong className="text-text-primary">Boutiq V4</strong> or upgrading to the revolutionary new <strong className="text-text-primary">Boutiq V5</strong>, you will find 100% authentic inventory ready for immediate, secure dispatch.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Link href="/products" className="bg-primary text-main-bg px-8 py-4 rounded-xl font-bold text-center hover:bg-accent transition-colors shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 duration-200">
                  Shop Boutiq Switch 
                </Link>
                <Link href="/about" className="bg-secondary-bg text-text-primary border border-border-soft px-8 py-4 rounded-xl font-bold text-center hover:bg-border-soft transition-colors tracking-wide">
                  Learn About Us
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 mt-4">
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <CheckCircle2 className="text-success h-5 w-5" />
                  <span>Verified COAs</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <Truck className="text-orange h-5 w-5" />
                  <span>Fast US Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                  <Lock className="text-primary h-5 w-5" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-secondary-bg rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-border-soft/50 group">
                 <Image 
                  src="/img.webp" 
                  alt="Boutiq Switch 2G Device - Premium Vape Collection" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                  referrerPolicy="no-referrer"
                 />
                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8">
                   <div className="bg-main-bg/40 backdrop-blur-md border border-border-soft rounded-2xl p-4 text-text-primary h-full backdrop-saturate-150">
                     <p className="font-bold mb-1 text-primary text-lg">New: Boutiq V5 Series</p>
                     <p className="text-sm text-text-primary/90">Dual strain live resin technology. Switch with a rapid click.</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories / Trust Strip */}
        <section className="bg-secondary-bg border-y border-border-soft text-main-bg py-8 overflow-hidden">
           <div className="flex gap-8 px-4 animate-marquee w-max select-none">
              {[...Array(2)].fill(0).map((_, i) => (
                <div key={i} className="flex gap-8">
                  <div className="flex-shrink-0 flex items-center gap-4 bg-main-bg border border-border-soft rounded-2xl p-5 min-w-[280px]">
                    <Shield className="text-primary" />
                    <div><h4 className="font-bold text-text-primary">100% Medical Grade</h4><p className="text-sm text-text-secondary">Authentic Boutiq Carts</p></div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4 bg-main-bg border border-border-soft rounded-2xl p-5 min-w-[280px]">
                    <Zap className="text-primary" />
                    <div><h4 className="font-bold text-text-primary">Boutiq Switch Tech</h4><p className="text-sm text-text-secondary">Advanced vaping experience</p></div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4 bg-main-bg border border-border-soft rounded-2xl p-5 min-w-[280px]">
                    <Award className="text-primary" />
                    <div><h4 className="font-bold text-text-primary">Boutiq V5 Series</h4><p className="text-sm text-text-secondary">The latest innovation</p></div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4 bg-main-bg border border-border-soft rounded-2xl p-5 min-w-[280px]">
                    <Fingerprint className="text-primary" />
                    <div><h4 className="font-bold text-text-primary">Boutiq V4 Mastered</h4><p className="text-sm text-text-secondary">Proven reliability</p></div>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* SECTION 2: Featured Products & Buying Guide */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-10 bg-secondary-bg p-8 lg:p-12 rounded-[2.5rem] border border-border-soft shadow-xl">
            <div className="max-w-3xl text-text-secondary leading-relaxed">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-text-primary">Explore Authentic Boutiq Carts & The Complete Catalog</h2>
              <div className="space-y-6">
                <p>
                  The market is heavily saturated with low-quality, untrustworthy alternatives, but genuine <strong className="text-primary font-medium text-text-primary">Boutiq Carts</strong> remain the undisputed leaders in flavor preservation, hardware reliability, and overall safety. By utilizing pharmaceutical-grade zirconia ceramics and unadulterated, precisely extracted live resin, Boutiq Carts deliver an unparalleled terpene profile that captures the true essence of the plant.
                </p>
                <p>
                  Our modern catalog extends beyond standard vape cartridges. At the heart of our premium lineup is the legendary <strong className="text-primary font-medium text-text-primary">Boutiq Switch</strong> collection. The Boutiq Switch series introduced the concept of dual-chamber tanks, fundamentally revolutionizing the disposable vape device market. Instead of forcing consumers to choose a single strain, the Boutiq Switch provides two unique tanks housed within a single, highly refined chassis. 
                </p>
                <p>
                  You can effortlessly alternate between tanks by clicking the physical hardware toggle located on the device. This ensures that you can match your vaping experience to your exact preferences at any given moment. Whether you are transitioning from daytime productivity to evening relaxation, the Boutiq Switch makes it completely seamless without the hassle of carrying multiple separate Boutiq Carts.
                </p>
                <div className="bg-main-bg/50 border border-border-soft rounded-2xl p-6 mt-8">
                  <h3 className="font-bold text-text-primary mb-3 text-lg">Key Advantages of Boutiq Carts:</h3>
                  <ul className="list-none space-y-3">
                    <li className="flex items-start gap-3">
                      <Shield className="text-success shrink-0 w-5 h-5 mt-0.5" />
                      <span><strong>Total Safety Verification:</strong> Every unit is backed by third-party Certificates of Analysis (COAs), ensuring absolute absence of harmful pesticides, solvents, and heavy metals.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Sparkles className="text-primary shrink-0 w-5 h-5 mt-0.5" />
                      <span><strong>Premium Distillate & Live Resin:</strong> Our Boutiq Carts utilize only high-grade, indoor-grown source material precisely refined for optimal burn temperatures.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="text-orange shrink-0 w-5 h-5 mt-0.5" />
                      <span><strong>Optimized Airflow Engineering:</strong> Both the Boutiq V5 and V4 systems prevent the clogging and spit-back issues that plague inferior disposable vape devices.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto shrink-0 md:sticky md:top-24">
              <Link href="/products" className="bg-primary text-main-bg px-8 py-4 rounded-xl font-bold hover:bg-accent transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                View All Boutiq Carts <ArrowRight size={18} />
              </Link>
              <Link href="/faq" className="bg-transparent border border-border-soft px-8 py-4 rounded-xl text-text-primary font-bold hover:bg-secondary-bg transition-colors flex items-center justify-center gap-2">
                Read Buying Guide <ChevronDown size={18} />
              </Link>
            </div>
          </div>
          
          <h3 className="text-2xl font-heading font-bold mb-8 text-text-primary px-2">Featured Deals & Best Sellers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {showcasedProducts.slice(0, 8).map(product => (
               <ProductCard key={product.id} product={product} />
             ))}
          </div>
        </section>

        {/* SECTION 3: Why Choose Boutiq & Customer Benefits */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-border-soft pt-20">
           <div className="text-center max-w-3xl mx-auto mb-16">
             <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6 text-text-primary">Why the Industry Trusts the Boutiq Switch</h2>
             <p className="text-lg text-text-secondary leading-relaxed">
               Crafting premium vape products requires an obsession with quality control. The <strong className="text-text-primary">Boutiq Switch</strong> ecosystem was built from the ground up to solve the most common frustrations in the vaping community: burnt coils, battery degradation, and flavor loss. Here is how we ensure an elite experience for every customer.
             </p>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-secondary-bg p-8 rounded-[2rem] border border-border-soft hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Shield size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Total Purity Control</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Every batch of our Boutiq Carts undergoes rigorous multiphasic testing. We screen for 66 distinct pesticides, heavy metals, microbial impurities, and mycotoxins. Our commitment to clean vaping means you taste the plant, never the processing.
                </p>
                <Link href="/about" className="text-sm font-bold text-primary hover:underline">Read our testing standards &rarr;</Link>
              </div>

              <div className="bg-secondary-bg p-8 rounded-[2rem] border border-border-soft hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Zap size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Dual Delivery Architecture</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  The Boutiq Switch is famous for its physical hardware switch, allowing users to alternate between two distinct premium vape product tanks seamlessly. It is an advanced vaping experience housed in a minimalist, ergonomic chassis.
                </p>
                <Link href="/products" className="text-sm font-bold text-primary hover:underline">Shop Switch Devices &rarr;</Link>
              </div>

              <div className="bg-secondary-bg p-8 rounded-[2rem] border border-border-soft hover:border-primary/50 transition-colors">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 text-primary">
                  <Bitcoin size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">Discreet, Fast Logistics</h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  Enjoy our fast delivery network. We process wholesale and retail orders rapidly with complete discretion. Plus, take advantage of our <strong className="text-text-primary">10% crypto discount</strong> and <strong className="text-text-primary">Free Shipping</strong> on orders over $500.
                </p>
                <Link href="/shipping" className="text-sm font-bold text-primary hover:underline">View Shipping Policy &rarr;</Link>
              </div>
           </div>
        </section>

        {/* SECTION 4 & 5: Boutiq V5 & V4 Block Details */}
        <section className="bg-main-bg relative py-20 border-t border-b border-border-soft">
           <div className="absolute inset-0 bg-secondary-bg/20 z-0"></div>
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
             <div className="grid lg:grid-cols-2 gap-16">
               
               {/* Boutiq V5 Content */}
               <div className="flex flex-col justify-center">
                 <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm mb-6 w-max">
                   <Rocket size={18} /> Next Generation
                 </div>
                 <h2 className="text-4xl font-heading font-bold mb-6 text-text-primary">The New Boutiq V5: Precision Redefined</h2>
                 <div className="prose prose-invert prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-text-primary max-w-none">
                   <p>
                     The vaping landscape has rapidly evolved, and the spectacular <strong className="text-primary font-medium text-text-primary">Boutiq V5</strong> represents the absolute bleeding edge of that evolution. As the flagship model in our collection of modern disposable vape devices, the Boutiq V5 was engineered from scratch to fix the inherent flaws found in mass-market hardware. 
                   </p>
                   <p>
                     With the <strong className="text-primary font-medium text-text-primary">Boutiq V5</strong>, you are getting an upgraded quartz-ceramic hybrid coil system that drastically reduces heat-up times while preventing the degradation of delicate live resin terpenes. The internal battery management system has been completely revamped for true step-down voltage control, ensuring that your last hit tastes exactly as rich and potent as your very first.
                   </p>
                   <p>
                     Furthermore, the Boutiq V5 perfectly integrates the iconic <strong className="text-primary font-medium text-text-primary">Boutiq Switch</strong> mechanism. The tank division is fortified with proprietary anti-leak medical-grade gaskets, allowing the thickest of diamond extracts to wick perfectly without any risk of crossover or clogging.
                   </p>
                   <div className="bg-secondary-bg p-6 rounded-2xl border border-border-soft my-6">
                     <h4 className="font-bold text-text-primary mb-3">Why Upgrade to the Boutiq V5?</h4>
                     <ul className="text-sm space-y-2">
                       <li>• <strong>Enhanced Battery Profile:</strong> An upsized cellular core guarantees you will vaporize every last drop in the tank.</li>
                       <li>• <strong>Instant Coil Priming:</strong> Minimizes dry pulls and eliminates the burnt tastes commonly seen in bulk disposable vape devices.</li>
                       <li>• <strong>Superior Boutiq Switch Tactility:</strong> The switching button is reinforced for a satisfying, durable click.</li>
                     </ul>
                   </div>
                   <p>
                     If you demand the most advanced vaping experience available today, the Boutiq V5 is your answer. It is our most refined premium vape product yet.
                   </p>
                 </div>
                 <div className="mt-8 flex gap-4">
                   <Link href="/products?category=v5" className="bg-primary text-main-bg px-6 py-3 rounded-xl font-bold hover:bg-accent transition-colors w-max">
                     Shop V5 Hardware
                   </Link>
                   <Link href="/blog/v5-engineering" className="text-text-secondary border border-border-soft px-6 py-3 rounded-xl font-bold hover:bg-secondary-bg transition-colors w-max">
                     Discover V5 Technology
                   </Link>
                 </div>
               </div>

               {/* Boutiq V5 Image */}
               <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-border-soft shadow-2xl">
                 <Image src="/boutiqv5.jpg" alt="Boutiq V5 Hardware Engineering - Premium Boutiq Carts" fill className="object-cover" referrerPolicy="no-referrer" />
                 <div className="absolute top-4 right-4 bg-primary text-main-bg font-bold px-4 py-1.5 rounded-full text-sm shadow-lg">New Release</div>
               </div>

               {/* Boutiq V4 Image */}
               <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-border-soft shadow-2xl order-last lg:order-none hidden lg:block">
                 <Image src="/boutiqv4.jpg" alt="Boutiq V4 Masterpiece Design - Legendary Vape Devices" fill className="object-cover cursor-pointer hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
               </div>

               {/* Boutiq V4 Content */}
               <div className="flex flex-col justify-center order-first lg:order-none">
                 <div className="inline-flex items-center gap-2 bg-text-secondary/10 text-text-primary px-4 py-2 rounded-full font-bold text-sm mb-6 w-max border border-border-soft">
                   <Award size={18} /> The Industry Standard
                 </div>
                 <h2 className="text-4xl font-heading font-bold mb-6 text-text-primary">Boutiq V4: The Timeless Classic</h2>
                 <div className="prose prose-invert prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-text-primary max-w-none">
                   <p>
                     While new models push boundaries and introduce novel mechanics, the legendary <strong className="text-primary font-medium text-text-primary">Boutiq V4</strong> remains one of the most celebrated and highly sought-after disposable vape devices on the entire market. It single-handedly set the precedent for what a high-quality, reliable lifestyle pen should look and feel like.
                   </p>
                   <p>
                     Countless users have made the <strong className="text-primary font-medium text-text-primary">Boutiq V4</strong> their daily driver because of its undeniable consistency. It is specifically the device that put <strong className="text-primary font-medium text-text-primary">Boutiq Carts</strong> on the map, proving that high-volume wholesale hardware does not have to compromise on burn quality, extract density, or airflow efficiency.
                   </p>
                   <p>
                     The Boutiq V4 utilizes a traditional smart-wick system that pairs flawlessly with liquid diamonds and highly viscous rosin concentrates. Many long-time purists still prefer the tighter airflow dynamics and distinct pull resistance of the V4 over newer iterations, solidifying its permanent place in our premium vape products lineup.
                   </p>
                   <div className="bg-main-bg border border-border-soft p-6 rounded-2xl my-6">
                      <h4 className="font-bold text-text-primary mb-2 flex items-center gap-2"><CheckCircle2 className="text-primary" size={16}/> Why People Love the V4:</h4>
                      <p className="text-sm text-text-secondary leading-relaxed">
                        The Boutiq V4 is synonymous with dependability. Unlike flimsy alternatives, the V4 features a weighted aluminum chassis, ensuring it survives daily carry. The <strong className="text-primary font-medium">Boutiq Switch</strong> model in the V4 line was the critical launchpoint that made alternating between popular vape flavors accessible to the masses.
                      </p>
                   </div>
                   <p>
                     It is dependable, powerful, thoroughly lab-tested, and an absolute necessity for any serious connoisseur who appreciates the foundations of modern vaping tech.
                   </p>
                 </div>
                 <div className="mt-8 flex gap-4">
                   <Link href="/products?category=v4" className="bg-main-bg border border-border-soft text-text-primary px-6 py-3 rounded-xl font-bold hover:bg-secondary-bg hover:border-primary/50 transition-colors w-max shadow-sm">
                     Shop V4 Collection
                   </Link>
                 </div>
               </div>

             </div>
           </div>
        </section>

        {/* SECTION 6: Product Categories & More links */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
          <div className="flex flex-col items-center mb-16 text-center">
             <h2 className="text-3xl font-heading font-bold text-text-primary mb-4">Shop Vape Collections By Category</h2>
             <p className="text-text-secondary max-w-2xl">
               Navigate our robust inventory. Whether you are hunting for popular vape flavors or checking out the latest rechargeable vape devices within the Boutiq Switch family, explore our carefully curated hubs.
             </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/products" className="group rounded-[2rem] bg-secondary-bg border border-border-soft p-6 flex flex-col items-start justify-between min-h-[200px] hover:border-primary transition-colors hover:shadow-lg hover:shadow-primary/5">
               <div className="bg-main-bg p-3 rounded-full border border-border-soft group-hover:scale-110 transition-transform">
                 <BatteryCharging className="text-primary" size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-2">Rechargeable Devices</h3>
                 <p className="text-sm text-text-secondary">Type-C fast-charging systems.</p>
               </div>
            </Link>
            <Link href="/products" className="group rounded-[2rem] bg-secondary-bg border border-border-soft p-6 flex flex-col items-start justify-between min-h-[200px] hover:border-primary transition-colors hover:shadow-lg hover:shadow-primary/5">
               <div className="bg-main-bg p-3 rounded-full border border-border-soft group-hover:scale-110 transition-transform">
                 <Sparkles className="text-primary" size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-2">Liquid Diamonds</h3>
                 <p className="text-sm text-text-secondary">Maximum potency extraction.</p>
               </div>
            </Link>
            <Link href="/products" className="group rounded-[2rem] bg-secondary-bg border border-border-soft p-6 flex flex-col items-start justify-between min-h-[200px] hover:border-primary transition-colors hover:shadow-lg hover:shadow-primary/5">
               <div className="bg-main-bg p-3 rounded-full border border-border-soft group-hover:scale-110 transition-transform">
                 <Droplets className="text-primary" size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-2">Live Resin</h3>
                 <p className="text-sm text-text-secondary">Full-spectrum terpene profiles.</p>
               </div>
            </Link>
            <Link href="/blog" className="group rounded-[2rem] bg-secondary-bg border border-border-soft p-6 flex flex-col items-start justify-between min-h-[200px] hover:border-primary transition-colors hover:shadow-lg hover:shadow-primary/5">
               <div className="bg-main-bg p-3 rounded-full border border-border-soft group-hover:scale-110 transition-transform">
                 <CheckCircle2 className="text-primary" size={24} />
               </div>
               <div>
                 <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors mb-2">Authentication Guides</h3>
                 <p className="text-sm text-text-secondary">How to spot fakes.</p>
               </div>
            </Link>
          </div>
        </section>

        {/* SECTION 8: FAQ Accordion UI */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
           <div className="text-center mb-12">
             <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-6 text-text-primary">Frequently Asked Questions</h2>
             <p className="text-text-secondary text-lg">
               Learn more about the <strong className="text-primary font-medium">Boutiq Switch</strong> platform, ordering wholesale Boutiq Carts, and our technology guarantees.
             </p>
           </div>

           <div className="space-y-4">
             {FAQS.slice(0, 8).map((faq, index) => (
                <details key={index} className="group bg-secondary-bg border border-border-soft rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-text-primary text-lg transition-colors hover:text-primary">
                    {faq.question}
                    <span className="transition duration-300 group-open:-rotate-180 text-primary">
                      <ChevronDown size={20} />
                    </span>
                  </summary>
                  <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-border-soft/30 pt-4">
                    {faq.answer.replace(/Boutiq Switch/g, 'Boutiq Switch').replace(/Boutiq Carts/g, 'Boutiq Carts')}
                  </div>
                </details>
             ))}

             <details className="group bg-secondary-bg border border-border-soft rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-text-primary text-lg transition-colors hover:text-primary">
                  What is the difference between the Boutiq V5 and the Boutiq V4?
                  <span className="transition duration-300 group-open:-rotate-180 text-primary">
                    <ChevronDown size={20} />
                  </span>
                </summary>
                <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-border-soft/30 pt-4">
                  The <strong className="text-primary font-medium">Boutiq V4</strong> utilizes a classic smart-wick architecture known for its profound reliability and consistent cloud production. The <strong className="text-primary font-medium">Boutiq V5</strong> is our next-generation offering that features upgraded quartz-ceramic heating, faster charging, and precision step-down voltage for enhanced terpene preservation. Both are outstanding disposable vape devices.
                </div>
            </details>

            <details className="group bg-secondary-bg border border-border-soft rounded-2xl [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer p-6 font-bold text-text-primary text-lg transition-colors hover:text-primary">
                  How does the 2-in-1 Boutiq Switch system function?
                  <span className="transition duration-300 group-open:-rotate-180 text-primary">
                    <ChevronDown size={20} />
                  </span>
                </summary>
                <div className="px-6 pb-6 text-text-secondary leading-relaxed border-t border-border-soft/30 pt-4">
                  The <strong className="text-primary font-medium">Boutiq Switch</strong> system houses two completely independent tanks within a single premium vape product. By toggling the physical button on the base, you reroute the electrical current and airflow to a different coil, allowing you to instantly alternate between popular vape flavors without carrying two separate Boutiq Carts.
                </div>
            </details>
           </div>
           
           <div className="mt-8 text-center">
             <Link href="/faq" className="text-text-secondary hover:text-primary font-bold inline-flex items-center gap-2 transition-colors">
               Read all Support FAQs <ArrowRight size={16} />
             </Link>
           </div>
        </section>

        {/* Footer Navigation Highlights / Regulatory outbounds */}
        <section className="bg-secondary-bg/30 border-t border-border-soft py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="flex flex-col md:flex-row gap-12 justify-between items-center text-center md:text-left">
               <div>
                  <h3 className="font-heading font-bold text-2xl text-text-primary mb-4">Your Authentic Source</h3>
                  <p className="text-text-secondary max-w-sm mb-6 leading-relaxed">
                    Purchase your <strong className="text-primary font-medium">Boutiq Switch</strong> sets, <strong className="text-primary font-medium">Boutiq Carts</strong>, <strong className="text-primary font-medium">Boutiq V5</strong>, and <strong className="text-primary font-medium">Boutiq V4</strong> units via secure channels.
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold text-text-primary">
                    <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <span className="text-border-soft">|</span>
                    <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <span className="text-border-soft">|</span>
                    <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
                  </div>
               </div>
               
               <div className="bg-main-bg border border-border-soft rounded-2xl p-6 text-sm text-text-secondary max-w-md">
                 <p className="mb-3"><strong className="text-text-primary">Compliance:</strong> All products are fully integrated with state verification software and undergo stringent analysis. We strictly mandate compliance with standard laboratory procedures.</p>
                 <p>For research and testing standardization, reference the <a href="https://www.fda.gov/" target="_blank" rel="noopener noreferrer external" className="text-primary hover:underline">Food and Drug Administration (FDA)</a> and <a href="https://www.iso.org/home.html" target="_blank" rel="noopener noreferrer external" className="text-primary hover:underline">ISO Standards</a> for laboratory compliance protocols.</p>
               </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

