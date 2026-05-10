'use client';

/**
 * PageGuard
 * Wrap any user-facing page with this component.
 * If the admin has turned off visibility for that page key, the user
 * is redirected to /dashboard automatically.
 *
 * Usage:
 *   // In app/(user)/crypto/page.tsx
 *   import PageGuard from '@/components/PageGuard';
 *
 *   export default function CryptoPage() {
 *     return (
 *       <PageGuard pageKey="crypto">
 *         <YourActualPageContent />
 *       </PageGuard>
 *     );
 *   }
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSiteConfig } from '../app/hooks/Usesiteconfig';

interface PageGuardProps {
  pageKey: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export default function PageGuard({ pageKey, children, redirectTo = '/dashboard' }: PageGuardProps) {
  const { config, loading, isPageVisible } = useSiteConfig();
  const router = useRouter();

  useEffect(() => {
    // Wait for config to load before deciding
    if (loading || !config) return;
    if (!isPageVisible(pageKey)) {
      router.replace(redirectTo);
    }
  }, [config, loading, pageKey, redirectTo, router]);

  // While loading or if page is hidden, render nothing (avoid flash)
  if (loading || (config && !isPageVisible(pageKey))) return null;

  return <>{children}</>;
}