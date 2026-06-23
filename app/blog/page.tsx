import Link from 'next/link';

export const metadata = {
  title: 'Blog & Articles | Boutiq Switch International',
};

import { BLOG_POSTS } from '@/lib/data';
import Image from 'next/image';

export default function BlogListing() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Research & Guides</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Everything you need to know about Boutiq hardware, verifying your products, and wholesale purchasing in the US.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {BLOG_POSTS.map(post => (
          <article key={post.slug} className="bg-transparent rounded-2xl border border-border-soft overflow-hidden group hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
            <div className="relative aspect-video w-full bg-secondary-bg overflow-hidden">
               <Image 
                src={post.image} 
                alt={post.title} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
               <div className="absolute top-4 left-4 bg-main-bg/90 backdrop-blur text-text-primary text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {post.category}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-grow">
               <div className="text-xs text-text-secondary mb-3 flex gap-3">
                 <span>{post.date}</span>
                 <span>•</span>
                 <span>{post.author}</span>
               </div>
               <Link href={`/blog/${post.slug}`} className="block mb-4 flex-grow">
                 <h2 className="font-heading font-bold text-xl mb-2 text-text-primary group-hover:text-primary transition-colors line-clamp-2">{post.title}</h2>
                 <p className="text-text-secondary text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
               </Link>
               <Link href={`/blog/${post.slug}`} className="text-primary font-bold text-sm hover:underline mt-auto">
                 Read Article &rarr;
               </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
