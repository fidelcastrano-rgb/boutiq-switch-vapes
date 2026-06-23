import type {Metadata} from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { MiniCart } from '@/components/MiniCart';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
});

export const metadata: Metadata = {
  title: 'Boutiq Switch International | Trusted Wholesaler',
  description: 'Premium disposable vapes wholesaler and retailer. US trusted supplier.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body className="bg-main-bg text-text-primary font-sans antialiased min-h-screen flex flex-col relative" suppressHydrationWarning>
        <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <div className="relative z-20">
          <FloatingWhatsApp />
          <MiniCart />
        </div>
      </body>
    </html>
  );
}
