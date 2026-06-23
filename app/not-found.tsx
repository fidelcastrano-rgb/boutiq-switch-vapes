import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 relative z-10">
      <h1 className="text-7xl md:text-9xl font-heading font-extrabold text-primary tracking-tighter mb-4 animate-pulse" id="not-found-heading">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-primary mb-6" id="not-found-subheading">
        Product or Page Not Found
      </h2>
      <p className="text-text-secondary max-w-md mb-8 leading-relaxed" id="not-found-text">
        The item you are looking for may have been moved, sold out, or is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="bg-primary hover:bg-accent text-main-bg px-8 py-4 font-bold rounded-xl transition-colors inline-block shadow-lg"
        id="not-found-home-btn"
      >
        Return Home
      </Link>
    </div>
  );
}
