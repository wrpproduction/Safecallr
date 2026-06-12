import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  noIndex?: boolean;
  jsonLd?: object | object[];
  keywords?: string | string[];
}

export default function SEOManager({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = 'https://safecallr.com/og-image.png', // Fallback
  noIndex = false,
  jsonLd,
  keywords
}: SEOProps) {
  const siteName = "SafeCallr";
  const fullTitle = `${title} | ${siteName}`;
  const url = canonical || `https://safecallr.com${window.location.pathname}`;

  return (
    <Helmet>
      <html lang="fr" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && (
        <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />
      )}
      <link rel="canonical" href={url} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />

      {/* Open Graph */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
