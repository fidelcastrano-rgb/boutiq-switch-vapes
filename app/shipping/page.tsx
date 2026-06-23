import { Truck, ShieldCheck, Mail, MapPin, CheckCircle2, Clock, Package } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Shipping & Delivery Policy | Boutiq Switch International',
  description: 'Detailed information regarding security, tracking, custom invoices, retail, and wholesale packaging.',
};

export default function ShippingPage() {
  const securityFeatures = [
    {
      title: 'Discrete Plain Packaging',
      description: 'All packages are sent in double-vacuum-sealed, smell-proof, plain padded mailers or generic cardboard boxes with zero brand markers, ensuring complete privacy.',
    },
    {
      title: 'No Signatures Required',
      description: 'Standard orders are delivered directly to your residential mailbox or drop-off point. No signature is requested unless explicitly chosen or for bulk wholesale containers.',
    },
    {
      title: 'Secure Hub Network Routing',
      description: 'We dispatched and route orders dynamically through California (CA) or Colorado (CO) regional hubs to guarantee optimal and unhindered transit pathways.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6" id="shipping-heading">Shipping & Delivery</h1>
        <p className="text-text-secondary text-lg" id="shipping-intro">
          Premium delivery standards. Smell-proof, hyper-secure, and discreet mail routing across all 50 US states.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 mb-20">
        {/* Shipping Methods overview Cards */}
        <div className="bg-secondary-bg border border-border-soft p-8 rounded-3xl flex flex-col justify-between" id="shipping-method-standard">
          <div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Truck />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">Standard Mail</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Reliable nationwide residential mail slot delivery. Secure and trackable through major postal carriers.
            </p>
          </div>
          <div>
            <div className="flex justify-between items-baseline border-t border-border-soft pt-4 mb-4">
              <span className="text-text-secondary text-sm">Delivery Time</span>
              <span className="font-bold text-text-primary text-sm">3-5 Business Days</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-text-secondary text-sm">Shipping Cost</span>
              <span className="font-bold text-text-primary text-lg">$20</span>
            </div>
          </div>
        </div>

        <div className="bg-transparent border-2 border-primary/45 p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden" id="shipping-method-express">
          <div className="absolute top-0 right-0 bg-primary/15 text-primary text-[10px] font-bold tracking-widest px-4 py-1.5 rounded-bl-2xl uppercase">
            Fastest
          </div>
          <div>
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6">
              <Clock />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">24-Hour Express</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              Priority Overnight courier routing. Ideal for time-critical orders or buyers requiring urgent deliveries.
            </p>
          </div>
          <div>
            <div className="flex justify-between items-baseline border-t border-border-soft/50 pt-4 mb-4">
              <span className="text-text-secondary text-sm">Delivery Time</span>
              <span className="font-bold text-primary text-sm">Within 24 Hours</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-text-secondary text-sm">Shipping Cost</span>
              <span className="font-bold text-text-primary text-lg">$60</span>
            </div>
          </div>
        </div>

        <div className="bg-secondary-bg border border-border-soft p-8 rounded-3xl flex flex-col justify-between" id="shipping-method-wholesale">
          <div>
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center text-success mb-6">
              <Package />
            </div>
            <h3 className="font-heading font-bold text-xl mb-3">Wholesale Shipping</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              High-volume box/pallet freight, dynamically routed and split packed into minor parcels for 100% arrival assurance.
            </p>
          </div>
          <div>
            <div className="flex justify-between items-baseline border-t border-border-soft pt-4 mb-4">
              <span className="text-text-secondary text-sm">Minimum Order</span>
              <span className="font-bold text-text-primary text-sm">$500+</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-text-secondary text-sm">Shipping Cost</span>
              <span className="font-bold text-success text-lg">FREE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security details section */}
      <div className="bg-secondary-bg/50 border border-border-soft rounded-[2.5rem] p-8 md:p-12 mb-20">
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl font-heading font-bold mb-4 flex items-center gap-3">
            <ShieldCheck className="text-primary" /> Uncompromising Dispatch Security
          </h2>
          <p className="text-text-secondary">
            Our shipping operations follow strict security protocols. We do not engage in local hand-to-hand transactions, physical storefront pickups, or unregulated drop-offs. Everything is cataloged, routed safely, and safely delivered.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {securityFeatures.map((feat, i) => (
            <div key={i} className="bg-main-bg border border-border-soft/60 rounded-2xl p-6" id={`shipping-feature-${i}`}>
              <h4 className="font-heading font-bold text-text-primary mb-2 flex items-center gap-2">
                <CheckCircle2 className="text-primary w-4 h-4 shrink-0" /> {feat.title}
              </h4>
              <p className="text-text-secondary text-xs leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order flows & Contact section */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h3 className="text-2xl font-heading font-bold">Frequently Asked Shipping Questions</h3>
          <div className="space-y-4 text-sm text-text-secondary">
            <div>
              <h4 className="font-bold text-text-primary mb-1">When is my tracking number generated?</h4>
              <p>Tracking numbers are registered and dispatched via Email or WhatsApp within 2-4 hours of payment clearance.</p>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-1">Do you ship to states with local restrictions?</h4>
              <p>Yes. Custom protective double-vacuum packing ensures full passage under discrete postal regulations country-wide.</p>
            </div>
            <div>
              <h4 className="font-bold text-text-primary mb-1">What happens if a box fails or is lost in transit?</h4>
              <p>We provide full insurance on priority standard and express shipments. If a parcel stalls, we dispatch a replacement box immediately. No questions asked.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-secondary-bg to-border-soft/30 border border-border-soft rounded-3xl p-8 text-center">
          <h4 className="font-heading font-bold text-xl mb-3">Ready to Place Your Order?</h4>
          <p className="text-text-secondary text-sm mb-6">
            Contact our Sales Team directly on WhatsApp for live order setup, payment confirmations, and automated daily dispatch schedules.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://wa.me/1234567890"

              className="bg-primary hover:bg-accent text-main-bg px-6 py-3 font-bold rounded-xl transition-colors text-sm"
              id="shipping-cta-wa"
            >
              Order via WhatsApp
            </Link>
            <Link
              href="/contact"
              className="border border-border-soft hover:bg-border-soft/40 text-text-primary px-6 py-3 font-bold rounded-xl transition-colors text-sm"
              id="shipping-cta-contact"
            >
              Alternative Contact Options
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
