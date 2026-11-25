import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_SITE_CONTENT } from '../data/defaultSiteContent';
import type { SiteContentPayload } from '../types/cms';

interface SiteContentContextValue {
  content: SiteContentPayload;
  loaded: boolean;
  refreshContent: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextValue>({
  content: DEFAULT_SITE_CONTENT,
  loaded: false,
  refreshContent: async () => {},
});

function syncSeoHeadTags(content: SiteContentPayload) {
  const { seo } = content;
  if (seo.siteTitle) {
    document.title = seo.siteTitle;
  }

  const setMeta = (selector: string, attrName: string, attrValue: string, text: string) => {
    let tag = document.querySelector(selector) as HTMLMetaElement | null;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrValue);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', text);
  };

  if (seo.metaDescription) {
    setMeta('meta[name="description"]', 'name', 'description', seo.metaDescription);
  }
  if (seo.ogTitle) {
    setMeta('meta[property="og:title"]', 'property', 'og:title', seo.ogTitle);
  }
  if (seo.ogDescription) {
    setMeta('meta[property="og:description"]', 'property', 'og:description', seo.ogDescription);
  }
  if (seo.siteShareImage) {
    setMeta('meta[property="og:image"]', 'property', 'og:image', seo.siteShareImage);
  }
  if (seo.faviconUrl) {
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = seo.faviconUrl;
  }
}

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContentPayload>(DEFAULT_SITE_CONTENT);
  const [loaded, setLoaded] = useState(false);

  const refreshContent = useCallback(async () => {
    try {
      const res = await fetch('/api/public/site', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as SiteContentPayload;
      setContent(data);
      syncSeoHeadTags(data);
      setLoaded(true);
    } catch {
      // Keep fallback defaults if offline
    }
  }, []);

  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  return (
    <SiteContentContext.Provider value={{ content, loaded, refreshContent }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export function useSiteContent() {
  return useContext(SiteContentContext);
}
