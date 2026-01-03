import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  // Product-specific
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock' | 'preorder';
}

const DEFAULT_TITLE = 'AnonForge: Discover & mint unique NFTs';
const DEFAULT_DESCRIPTION = 'Browse curated collections from independent creators, or build and launch your own NFT project with built-in minting powered by NMKR.';
const DEFAULT_IMAGE = 'https://anonforge.app/og-image.png';
const SITE_NAME = 'AnonForge';
const BASE_URL = 'https://anonforge.app';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  noIndex = false,
  keywords = [],
  author,
  publishedTime,
  modifiedTime,
  price,
  currency = 'ADA',
  availability,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const fullUrl = url ? `${BASE_URL}${url}` : BASE_URL;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  // Build structured data based on type
  const structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
  };

  if (type === 'product' && price !== undefined) {
    Object.assign(structuredData, {
      '@type': 'Product',
      name: title || SITE_NAME,
      description,
      image: fullImage,
      url: fullUrl,
      brand: {
        '@type': 'Brand',
        name: author || SITE_NAME,
      },
      offers: {
        '@type': 'Offer',
        price: price.toString(),
        priceCurrency: currency,
        availability: availability === 'in stock' 
          ? 'https://schema.org/InStock' 
          : availability === 'preorder'
          ? 'https://schema.org/PreOrder'
          : 'https://schema.org/OutOfStock',
      },
    });
  } else if (type === 'article') {
    Object.assign(structuredData, {
      '@type': 'Article',
      headline: title,
      description,
      image: fullImage,
      url: fullUrl,
      author: author ? { '@type': 'Person', name: author } : undefined,
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url: `${BASE_URL}/favicon.svg`,
        },
      },
    });
  } else {
    Object.assign(structuredData, {
      '@type': 'WebPage',
      name: title || SITE_NAME,
      description,
      url: fullUrl,
    });
  }

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={fullUrl} />
      
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type === 'product' ? 'product' : type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={SITE_NAME} />
      
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Product specific */}
      {type === 'product' && price !== undefined && (
        <>
          <meta property="product:price:amount" content={price.toString()} />
          <meta property="product:price:currency" content={currency} />
        </>
      )}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}
