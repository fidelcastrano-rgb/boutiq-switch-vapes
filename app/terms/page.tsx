import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use | Boutiq Switch International',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 prose prose-slate">
       <h1 className="text-4xl font-heading font-bold mb-8">Terms of Use</h1>
       <p className="text-text-secondary">Last Updated: June 2024</p>
       
       <h2 className="text-2xl font-bold mt-12 mb-4">1. Acceptance of Terms</h2>
       <p className="text-text-secondary leading-relaxed">
         By accessing or using the Boutiq Switch International website, you agree to comply with and be bound by these Terms of Use. All products are intended for medical research or adult recreational use in jurisdictions where legally permitted. 
       </p>

       <h2 className="text-2xl font-bold mt-12 mb-4">2. Age Requirement</h2>
       <p className="text-text-secondary leading-relaxed">
         You must be at least 21 years old to purchase products from this site. Falsifying your age is illegal and violates our terms of service.
       </p>

       <h2 className="text-2xl font-bold mt-12 mb-4">3. Security</h2>
       <p className="text-text-secondary leading-relaxed">
         We use secure servers and do not store plain-text financial information. Cryptocurrency transactions are final once confirmed on the blockchain.
       </p>
    </div>
  );
}
