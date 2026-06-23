import Image from 'next/image';
import { ShieldCheck, Crosshair, Award } from 'lucide-react';

export const metadata = {
  title: 'About Us | Boutiq Switch International',
};

export default function AboutPage() {
  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="bg-text-primary text-main-bg py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 max-w-3xl leading-tight">Setting the standard for premium medical research.</h1>
          <p className="text-xl text-main-bg/70 max-w-xl">
            Boutiq Switch International is the US&apos;s most trusted wholesaler of verified, cleanly-extracted medical grade disposables.
          </p>
        </div>
      </section>

      {/* Stats Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20 mb-20">
         <div className="bg-transparent rounded-3xl shadow-xl border border-border-soft p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border-soft">
            <div className="text-center px-4">
               <span className="block text-3xl font-heading font-bold text-primary mb-1">2021</span>
               <span className="text-sm font-medium text-text-secondary">ESTABLISHED</span>
            </div>
            <div className="text-center px-4">
               <span className="block text-3xl font-heading font-bold text-primary mb-1">50+</span>
               <span className="text-sm font-medium text-text-secondary">STATES SERVED</span>
            </div>
            <div className="text-center px-4">
               <span className="block text-3xl font-heading font-bold text-primary mb-1">0%</span>
               <span className="text-sm font-medium text-text-secondary">PESTICIDES</span>
            </div>
            <div className="text-center px-4">
               <span className="block text-3xl font-heading font-bold text-primary mb-1">100%</span>
               <span className="text-sm font-medium text-text-secondary">LAB VERIFIED</span>
            </div>
         </div>
      </section>

      {/* Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
         <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
               <h2 className="text-sm font-bold tracking-widest text-primary uppercase mb-3">Our Story</h2>
               <h3 className="text-3xl md:text-4xl font-heading font-bold mb-6">Driven by purity.</h3>
               <p className="text-lg text-text-secondary leading-relaxed mb-6">
                 We started Boutiq with a simple mission: to clean up an industry plagued by counterfeits and unsafe extraction methods. We believe that consumers deserve absolute transparency regarding what they are putting into their bodies.
               </p>
               <p className="text-lg text-text-secondary leading-relaxed">
                 By focusing on premium 2G hardware and rigorous third-party testing, we&apos;ve built the most trusted wholesale network in the United States. Every product that ships from our facilities is guaranteed authentic.
               </p>
            </div>
            <div className="bg-secondary-bg rounded-[2.5rem] p-8 md:p-12 relative border border-border-soft">
               <div className="absolute top-0 right-8 -translate-y-1/2 bg-transparent rounded-full p-4 shadow-lg border border-border-soft">
                  <ShieldCheck size={32} className="text-success" />
               </div>
               <h4 className="text-xl font-bold font-heading mb-4">The COA Promise</h4>
               <p className="text-text-secondary mb-8">All batches are tested by verified third-party labs for 66+ pesticides, heavy metals, microbial impurities, and mycotoxins.</p>
               <div className="bg-transparent rounded-xl p-4 border border-border-soft flex items-center justify-between">
                  <span className="font-medium text-sm">Status:</span>
                  <span className="bg-success text-main-bg px-3 py-1 rounded-full text-xs font-bold">100% PASS</span>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
}
