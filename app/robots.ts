import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://boutiqswitchvapes.us';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/checkout/',
        '/admin/',
        '/terms',
        '/privacy'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
