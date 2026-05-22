import { useEffect } from 'react';
import { BRAND } from '@/utils/constants';

/**
 * Meta — Dynamic SEO component to update page title.
 */
export default function Meta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BRAND.name} Admin` : `${BRAND.name} — ${BRAND.tagline}`;
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || BRAND.description);
    }
  }, [title, description]);

  return null;
}
