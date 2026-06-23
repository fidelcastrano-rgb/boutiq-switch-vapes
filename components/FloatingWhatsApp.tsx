'use client';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function FloatingWhatsApp() {
  return (
    <Link 
      href="https://wa.me/1234567890" 
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 bg-[#25D366] text-main-bg rounded-full px-4 py-3 flex items-center gap-2 shadow-lg hover:bg-[#20bd5a] transition-all hover:-translate-y-1"
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle size={24} />
      <span className="hidden md:inline font-medium">Chat with us</span>
    </Link>
  );
}
