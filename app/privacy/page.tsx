import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Boutiq Switch International',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 prose prose-slate">
       <h1 className="text-4xl font-heading font-bold mb-8">Privacy Policy</h1>
       <p className="text-text-secondary">Last Updated: June 2024</p>
       
       <h2 className="text-2xl font-bold mt-12 mb-4">1. Information We Collect</h2>
       <p className="text-text-secondary leading-relaxed">
         We collect information strictly necessary for fulfilling orders: shipping address, email, and generalized order details. If utilizing Cryptocurrency as a payment method, we prioritize your anonymity and mask metadata where structurally possible.
       </p>

       <h2 className="text-2xl font-bold mt-12 mb-4">2. Communications</h2>
       <p className="text-text-secondary leading-relaxed">
         By providing your email or WhatsApp number, you agree to receive transactional alerts (order confirmations, shipping tracking). We do not spam or sell data to third-party marketing firms.
       </p>

       <h2 className="text-2xl font-bold mt-12 mb-4">3. Data Retention</h2>
       <p className="text-text-secondary leading-relaxed">
         Invoices are retained for standard operational accounting, purged as required by jurisdictional limits.
       </p>
    </div>
  );
}
