'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="max-w-xl mx-auto text-center space-y-8 animate-fade-in" id="success-inner">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#d4af37]/15 mb-4 border border-[#d4af37]/30">
        <CheckCircle size={44} className="text-[#d4af37]" />
      </div>

      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans">Order Placed!</h1>
        <p className="text-gray-400 text-sm font-medium">Thank you for your business. Your order is registered.</p>
      </div>

      <div className="p-6 bg-[#121214] border border-[#1f1f23] rounded-3xl space-y-4">
        <div className="flex flex-col gap-2 text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#d4af37] font-bold">Secure Order Reference</span>
          <span className="font-mono font-bold text-sm tracking-wider text-white bg-[#18181c] border border-[#27272a] rounded-xl px-4 py-2.5 break-all select-all inline-block">
            {orderId || 'N/A'}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
        Your order transaction details have been securely persisted inside our Cloudflare D1 high-performance serverless database logs. Keep this order reference for verification.
      </p>

      <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/products" className="px-8 bg-[#d4af37] text-black py-4 rounded-xl font-bold text-sm hover:bg-[#c5a030] transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-[#d4af37]/15 cursor-pointer">
          Continue Shopping <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-20 flex items-center justify-center px-4 font-sans" id="success-screen">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#d4af37] w-10 h-10" />
          <p className="text-gray-400 font-medium font-sans">Compiling dispatch details...</p>
        </div>
      }>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
