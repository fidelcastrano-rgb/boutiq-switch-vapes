import { Mail, MessageSquare, MapPin, Truck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Contact & Ordering | Boutiq Switch International',
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">Contact & Ordering</h1>
        <p className="text-text-secondary text-lg">
          Fast response times. Secure wholesale processing. Contact our sales team using one of the methods below.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Left Column: Contact Methods */}
        <div className="space-y-8">
           {/* WhatsApp Card */}
           <div className="bg-transparent rounded-3xl border-2 border-[#25D366] p-8 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 right-0 bg-[#25D366] text-main-bg text-xs font-bold px-4 py-2 rounded-bl-2xl">
               RECOMMENDED
             </div>
             <h2 className="text-2xl font-heading font-bold mb-2 text-text-primary flex items-center gap-3">
                <MessageSquare className="text-[#25D366]" /> WhatsApp Sales
             </h2>
             <p className="text-text-secondary mb-6">Fastest processing times for both retail and wholesale orders.</p>
             
             <div className="bg-secondary-bg rounded-xl p-4 mb-6 text-sm">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border-soft">
                      <td className="py-2 text-text-secondary font-medium">Response Time:</td>
                      <td className="py-2 text-right font-bold text-text-primary">&lt; 5 minutes</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-text-secondary font-medium">Availability:</td>
                      <td className="py-2 text-right font-bold text-text-primary">24/7 Support</td>
                    </tr>
                  </tbody>
                </table>
             </div>

             <Link href="https://wa.me/1234567890" className="bg-[#25D366] text-main-bg w-full block text-center py-4 rounded-xl font-bold hover:bg-[#20bd5a] transition-colors">
               Chat on WhatsApp
             </Link>
           </div>

           {/* Email Card */}
           <div className="bg-secondary-bg rounded-3xl border border-border-soft p-8">
             <h2 className="text-2xl font-heading font-bold mb-2 text-text-primary flex items-center gap-3">
                <Mail className="text-primary" /> Email Inquiries
             </h2>
             <p className="text-text-secondary mb-6">For business inquiries, vendor applications, or order support.</p>
             <Link href="mailto:sales@boutiqswitchvapes.us" className="bg-transparent border border-border-soft text-text-primary w-full block text-center py-4 rounded-xl font-bold hover:bg-border-soft transition-colors">
               sales@boutiqswitchvapes.us
             </Link>
           </div>

           {/* Order Flow */}
           <div>
             <h3 className="font-heading font-bold text-xl mb-4">4-Step Order Flow</h3>
             <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border-soft before:to-transparent">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-main-bg bg-secondary-bg text-text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">1</div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-soft bg-transparent shadow-sm">
                      <div className="font-bold text-text-primary">Contact Sales</div>
                      <div className="text-sm text-text-secondary">Message us via WhatsApp with your order details.</div>
                    </div>
                </div>
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-main-bg bg-secondary-bg text-text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">2</div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-soft bg-transparent shadow-sm">
                      <div className="font-bold text-text-primary">Invoice Generaton</div>
                      <div className="text-sm text-text-secondary">Review your custom invoice (Crypto/Card options).</div>
                    </div>
                </div>
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-main-bg bg-secondary-bg text-text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">3</div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-soft bg-transparent shadow-sm">
                      <div className="font-bold text-text-primary">Payment Verification</div>
                      <div className="text-sm text-text-secondary">Secure payment processing.</div>
                    </div>
                </div>
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-main-bg bg-primary text-main-bg shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">4</div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border-soft bg-transparent shadow-sm">
                      <div className="font-bold text-text-primary">Tracking Issued</div>
                      <div className="text-sm text-text-secondary">Shipment tracking provided instantly.</div>
                    </div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: Policies & Locations */}
        <div className="space-y-8">
           {/* No In-Store Warning */}
           <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl">
             <h3 className="text-red-900 font-bold mb-2">Important Security Notice</h3>
             <ul className="list-disc list-inside text-red-800 text-sm space-y-1">
               <li>We do NOT offer in-store pickup.</li>
               <li>We do NOT do street meetups.</li>
               <li>All orders are strictly mail-delivery only.</li>
             </ul>
           </div>

           {/* Distribution Hubs */}
           <div>
             <h3 className="font-heading font-bold text-xl mb-4">Distribution Hubs</h3>
             <div className="grid sm:grid-cols-2 gap-4">
               <div className="border border-border-soft rounded-2xl p-5 bg-transparent">
                 <MapPin className="text-primary mb-3" />
                 <h4 className="font-bold mb-1">Los Angeles, CA</h4>
                 <p className="text-text-secondary text-sm">Primary West Coast Hub</p>
               </div>
               <div className="border border-border-soft rounded-2xl p-5 bg-transparent">
                 <MapPin className="text-primary mb-3" />
                 <h4 className="font-bold mb-1">Denver, CO</h4>
                 <p className="text-text-secondary text-sm">Central Hub</p>
               </div>
             </div>
           </div>

           {/* Shipping Info */}
           <div className="bg-secondary-bg rounded-3xl p-8 border border-border-soft">
              <h3 className="font-heading font-bold text-xl mb-6 flex items-center gap-3">
                 <Truck className="text-primary" /> USA Shipping Options
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-left text-text-secondary">
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-soft">
                  <tr>
                    <td className="py-4 font-medium text-text-primary">Standard</td>
                    <td className="py-4 text-text-secondary">3-5 Bus. Days</td>
                    <td className="py-4 text-right font-bold text-text-primary">$20</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-text-primary">Express</td>
                    <td className="py-4 text-text-secondary">24 Hours</td>
                    <td className="py-4 text-right font-bold text-text-primary">$60</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-text-primary">Wholesale (&gt;$500)</td>
                    <td className="py-4 text-text-secondary">3-5 Bus. Days</td>
                    <td className="py-4 text-right font-bold text-success">FREE</td>
                  </tr>
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}
