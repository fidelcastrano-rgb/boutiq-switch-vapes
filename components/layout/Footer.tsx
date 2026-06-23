import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-main-bg text-text-primary pt-16 pb-8 border-t border-border-soft mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div>
            <h3 className="font-heading font-bold text-xl mb-4 tracking-tighter">BOUTIQ <span className="text-primary">SWITCH</span></h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              US&apos;s Most Trusted Disposable Carts Wholesaler and Retailer. Premium tier medical-grade disposables.
            </p>
            <p className="text-sm text-text-secondary">sales@boutiqswitchvapes.us</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 tracking-wider text-sm uppercase">Products</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/products" className="hover:text-primary transition-colors">Shop All</Link></li>
              <li><Link href="/products?category=Boutiq V5" className="hover:text-primary transition-colors">Boutiq V5 Carts</Link></li>
              <li><Link href="/products?category=Boutiq V4" className="hover:text-primary transition-colors">Boutiq V4 Switch</Link></li>
              <li><Link href="/products?category=Boutiq Snack Packs" className="hover:text-primary transition-colors">Boutiq Snack Packs</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 tracking-wider text-sm uppercase">Research</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/blog" className="hover:text-primary transition-colors">Blog & Guides</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/blog/real-vs-fake-the-ultimate-guide-to-verifying-your-boutiq-switch" className="hover:text-primary transition-colors">Verify Product</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 tracking-wider text-sm uppercase">Company</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border-soft text-center md:text-left text-sm text-text-secondary flex flex-col md:flex-row justify-between items-center opacity-80">
          <p className="font-mono text-xs uppercase tracking-widest">© {new Date().getFullYear()} Boutiq Switch. All rights reserved.</p>
          <div className="mt-4 md:mt-0 max-w-xl text-[10px] font-mono tracking-widest uppercase opacity-60">
            Disclaimer: Products contain THC substances. For medical and recreational use. Keep out of reach of children.
          </div>
        </div>
      </div>
    </footer>
  );
}
