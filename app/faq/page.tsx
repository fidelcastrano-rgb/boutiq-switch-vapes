import Link from 'next/link';
import { Search } from 'lucide-react';
import { FAQS } from '@/lib/data';

export const metadata = {
  title: 'FAQ & Support | Boutiq Switch International',
  description: 'Frequently asked questions about ordering, shipping, and product verification.',
};

export default function FAQPage() {
  const categories = ['Delivery', 'Pricing', 'Quality', 'Buying & Ordering'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })
      }} />

      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">How can we help?</h1>
        <div className="relative max-w-xl mx-auto">
          <input 
            type="text" 
            placeholder="Search questions..." 
            className="w-full bg-secondary-bg border border-border-soft rounded-full px-6 py-4 pl-12 focus:outline-none focus:border-primary transition-colors text-text-primary"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
        </div>
      </div>

      <div className="grid md:grid-cols-[250px_1fr] gap-12 lg:gap-24 items-start">
        {/* Sticky Sidebar */}
        <aside className="sticky top-24 hidden md:block">
          <h3 className="font-bold text-lg mb-6">Categories</h3>
          <ul className="space-y-3">
            {categories.map(cat => (
              <li key={cat}>
                <button className="text-text-secondary hover:text-primary font-medium text-left w-full transition-colors">
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* FAQ Content */}
        <div className="space-y-12">
          {categories.map(category => {
            const categoryFaqs = FAQS.filter(faq => faq.category === category);
            if (categoryFaqs.length === 0) return null;
            
            return (
              <section key={category} id={category.toLowerCase().replace(/\s+/g, '-')}>
                <h2 className="text-2xl font-heading font-bold mb-6 pb-2 border-b border-border-soft">{category}</h2>
                <div className="space-y-6">
                  {categoryFaqs.map((faq, i) => (
                    <div key={i} className="bg-transparent rounded-2xl border border-border-soft p-6">
                      <h3 className="font-bold text-lg mb-3 text-text-primary">{faq.question}</h3>
                      <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
          
          <div className="bg-secondary-bg rounded-3xl p-8 md:p-12 text-center mt-12 bg-gradient-to-br from-secondary-bg to-border-soft/20">
             <h3 className="text-2xl font-bold font-heading mb-4">Still have questions?</h3>
             <p className="text-text-secondary mb-8 max-w-lg mx-auto">Our sales team is available 24/7 on WhatsApp to help with wholesale pricing or general inquiries.</p>
             <Link href="https://wa.me/1234567890" className="bg-primary text-main-bg px-8 py-4 rounded-xl font-bold shadow-lg inline-block hover:bg-accent transition-colors">
               Contact Support
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
