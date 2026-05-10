/**
 * useSiteConfig
 * Fetches site config from the public endpoint and caches it for the session.
 * Use this in layout.tsx, sidebar, footer, and page guards.
 *
 * Usage:
 *   const { config, loading } = useSiteConfig();
 *   if (!config) return null;
 *
 *   // Check page visibility
 *   const cryptoPage = config.pages.find(p => p.key === 'crypto');
 *   if (!cryptoPage?.visible) redirect('/dashboard');
 *
 *   // Branding
 *   <title>{config.bankName}</title>
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export interface NavPage {
  key: string;
  label: string;
  path: string;
  visible: boolean;
  order: number;
  isCustom: boolean;
  icon: string;
  description: string;
  content: string;
}

export interface FooterLink    { label: string; href: string; }
export interface FooterSection { title: string; links: FooterLink[]; }

export interface SiteConfig {
  bankName: string;
  bankTagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  supportEmail: string;
  supportPhone: string;
  headquartersAddress: string;
  fdicNotice: string;
  copyrightText: string;
  pages: NavPage[];
  footerSections: FooterSection[];
}

// Module-level cache so multiple components don't each fetch
let _cache: SiteConfig | null = null;
let _promise: Promise<SiteConfig> | null = null;

async function fetchConfig(): Promise<SiteConfig> {
  if (_cache) return _cache;
  if (_promise) return _promise;

  _promise = axios
    .get(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/site-config`)
    .then(res => {
      const d = res.data?.data ?? res.data;
      _cache = d;
      return d as SiteConfig;
    })
    .catch(() => {
      // Return safe defaults if backend is unreachable
      const fallback: SiteConfig = {
        bankName:            'NexaBank',
        bankTagline:         '',
        logoUrl:             '',
        faviconUrl:          '',
        primaryColor:        '#f59e0b',
        supportEmail:        '',
        supportPhone:        '',
        headquartersAddress: '',
        fdicNotice:          'Your deposits are FDIC insured up to $250,000.',
        copyrightText:       '',
        pages:               [],
        footerSections:      [],
      };
      _cache = fallback;
      return fallback;
    });

  return _promise;
}

/** Invalidate cache (call after admin saves settings) */
export function invalidateSiteConfig() {
  _cache   = null;
  _promise = null;
}

export function useSiteConfig() {
  const [config,  setConfig]  = useState<SiteConfig | null>(_cache);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setConfig(_cache); setLoading(false); return; }
    setLoading(true);
    fetchConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  /** Check if a page key is visible (defaults to true if config not loaded yet) */
  const isPageVisible = (key: string): boolean => {
    if (!config) return true;
    const page = config.pages.find(p => p.key === key);
    return page?.visible ?? true;
  };

  /** Sorted visible pages for building sidebar nav */
  const visiblePages = config
    ? [...config.pages].filter(p => p.visible).sort((a, b) => a.order - b.order)
    : [];

  return { config, loading, isPageVisible, visiblePages };
}