'use client';

/**
 * PageGuard
 * Redirects users away from pages that the admin has turned off.
 *
 * Usage — wrap your page content:
 *   <PageGuard pageKey="crypto">
 *     <CryptoContent />
 *   </PageGuard>
 *
 * The pageKey must match the `key` field in the SiteConfig pages array,
 * e.g. 'crypto', 'investments', 'loans', 'cheque', 'kyc', etc.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteConfig } from '../app/hooks/Usesiteconfig';

interface Props {
  pageKey: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export default function PageGuard({ pageKey, children, redirectTo = '/dashboard' }: Props) {
  const { config, loading, isPageVisible } = useSiteConfig();
  const router = useRouter();

  useEffect(() => {
    if (loading || !config) return;
    if (!isPageVisible(pageKey)) {
      router.replace(redirectTo);
    }
  }, [config, loading, pageKey, redirectTo, router]);

  // Show nothing while loading config or if page is hidden
  if (loading) return null;
  if (config && !isPageVisible(pageKey)) return null;

  return <>{children}</>;
}