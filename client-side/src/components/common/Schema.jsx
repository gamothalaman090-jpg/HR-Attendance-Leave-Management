import { BRAND } from '@/utils/constants';

/**
 * Schema — Renders JSON-LD structured data for SEO.
 * Supported types: Organization, WebSite, BreadcrumbList
 */
export default function Schema() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': BRAND.name,
    'url': window.location.origin,
    'logo': `${window.location.origin}/logo.png`,
    'description': BRAND.description,
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': BRAND.name,
    'url': window.location.origin,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${window.location.origin}/app/employees?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(websiteSchema)}
      </script>
    </>
  );
}
