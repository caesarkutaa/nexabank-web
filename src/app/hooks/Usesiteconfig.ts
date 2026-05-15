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

const API = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1');

const DEFAULT: SiteConfig = {
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

// ── Module-level store so all components share one copy ────────
let _config: SiteConfig | null = null;
let _fetching: Promise<SiteConfig> | null = null;
const _listeners = new Set<(c: SiteConfig) => void>();

function notify(c: SiteConfig) {
  _config = c;
  _listeners.forEach(fn => fn(c));
}

async function fetchFresh(): Promise<SiteConfig> {
  if (_fetching) return _fetching;
  _fetching = axios
    .get(`${API()}/site-config`, { params: { _t: Date.now() } }) // bust any HTTP cache
    .then(res => {
      const d = res.data?.data ?? res.data;
      const merged = { ...DEFAULT, ...d };
      _fetching = null;
      notify(merged);
      return merged;
    })
    .catch(() => {
      _fetching = null;
      const fallback = _config ?? DEFAULT;
      notify(fallback);
      return fallback;
    });
  return _fetching;
}

/**
 * Call after admin saves any setting — forces every mounted component
 * (sidebar, landing page, PageGuard) to re-fetch from the server.
 */
export function invalidateSiteConfig() {
  _config   = null;
  _fetching = null;
  fetchFresh(); // kick off a refresh immediately
}

export function useSiteConfig() {
  const [config,  setConfig]  = useState<SiteConfig | null>(_config);
  const [loading, setLoading] = useState(!_config);

  useEffect(() => {
    // Subscribe to future updates (from invalidateSiteConfig)
    const onUpdate = (c: SiteConfig) => { setConfig(c); setLoading(false); };
    _listeners.add(onUpdate);

    // If we already have a cached value, use it; otherwise fetch
    if (_config) {
      setConfig(_config);
      setLoading(false);
    } else {
      setLoading(true);
      fetchFresh().then(c => { setConfig(c); setLoading(false); });
    }

    return () => { _listeners.delete(onUpdate); };
  }, []);

  const isPageVisible = (key: string): boolean => {
    if (!config || config.pages.length === 0) return true;
    const page = config.pages.find(p => p.key === key);
    if (!page) return true; // unknown key → show by default
    return page.visible;
  };

  const visiblePages: NavPage[] = config
    ? [...config.pages].filter(p => p.visible).sort((a, b) => a.order - b.order)
    : [];

  return { config, loading, isPageVisible, visiblePages };
}