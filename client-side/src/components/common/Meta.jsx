import { useEffect } from 'react';
import { BRAND } from '@/utils/constants';

/**
 * Meta — Dynamic SEO component to update page title and description.
 * 
 * @param {string} title - Page specific title (appended to brand name)
 * @param {string} description - Meta description for SEO
 */
export default function Meta({ title, description }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BRAND.name}` : `${BRAND.name} — ${BRAND.tagline}`;
    document.title = fullTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description || BRAND.description);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = description || BRAND.description;
      document.head.appendChild(newMeta);
    }
  }, [title, description]);

  return null;
}
