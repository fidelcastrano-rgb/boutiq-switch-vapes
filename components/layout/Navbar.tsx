'use client';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Shop', href: '/products' },
    { label: 'About', href: '/about' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Blog', href: '/blog' },
  ];

  return (
    <>
      {/* Notice/announcement bar */}
      <div className="bg-text-primary text-main-bg text-sm py-2 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee flex gap-8">
          <span>🎉 FREE SHIPPING ON ORDERS OVER $500</span>
          <span>💎 10% OFF ALL CRYPTO ORDERS</span>
          <span>✨ NEW CUSTOMERS SAVE 10% WITH CODE WELCOME10</span>
          <span>🎉 FREE SHIPPING ON ORDERS OVER $500</span>
          <span>💎 10% OFF ALL CRYPTO ORDERS</span>
        </div>
      </div>

      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 bg-main-bg/80 backdrop-blur-md border-b border-border-soft backdrop-saturate-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="font-heading font-bold text-xl tracking-tight text-text-primary">
              BOUTIQ <span className="text-primary">SWITCH</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {links.map((link) => (
                <Link key={link.label} href={link.href} className="text-text-secondary hover:text-primary transition-colors text-sm font-medium">
                  {link.label}
                </Link>
              ))}
              <Link href="/checkout" className="bg-text-primary text-main-bg px-5 py-2 rounded-full font-medium hover:bg-text-primary/90 transition-colors text-sm">
                Order Now
              </Link>
            </div>

            {/* Mobile menu button */}
            <button onClick={toggle} className="md:hidden p-2 text-text-primary" aria-label="Toggle menu">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-main-bg flex flex-col pt-24 px-6 md:hidden">
          {links.map((link) => (
            <Link key={link.label} href={link.href} onClick={toggle} className="text-2xl font-heading font-bold text-text-primary py-4 border-b border-border-soft">
              {link.label}
            </Link>
          ))}
          <Link href="/checkout" onClick={toggle} className="mt-8 bg-text-primary text-main-bg px-6 py-4 rounded-xl font-bold text-center text-lg">
            Order Now
          </Link>
        </div>
      )}
    </>
  );
}
