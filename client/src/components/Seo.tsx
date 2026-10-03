import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description?: string;
  /** Absolute or relative path for the canonical URL. */
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  /** Adds "noindex" for private pages such as dashboards. */
  noIndex?: boolean;
}

const SITE_NAME = 'UyirAngadi';
const DEFAULT_DESCRIPTION =
  "Tamil Nadu's animal marketplace. Buy and sell cows, bulls, goats, sheep, chicken, dogs and more directly from sellers near you.";

function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  return (fromEnv || window.location.origin).replace(/\/$/, '');
}

/**
 * SEO meta tags. React 19 hoists <title>/<meta>/<link> rendered anywhere in the
 * tree into <head>, so no external helmet library is needed.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image,
  type = 'website',
  noIndex = false,
}: SeoProps) {
  const siteUrl = getSiteUrl();
  const canonical = path ? `${siteUrl}${path}` : siteUrl;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;

  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </>
  );
}
