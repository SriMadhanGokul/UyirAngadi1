import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import ListingGrid from '../components/ListingGrid';
import Pagination from '../components/Pagination';
import listingService from '../services/listingService';
import type { Listing } from '../types';

const PAGE_SIZE = 12;

/**
 * Global Sold History: every animal any user has marked as sold.
 * Read-only — sold animals leave the active listings but stay visible here
 * so buyers can research past prices. Buyer identity is never exposed.
 */
export default function SoldHistoryPage() {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Listing[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (page: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await listingService.soldHistory({ page, limit: PAGE_SIZE });
        setListings(res.data);
        setMeta({ total: res.total, page: res.page, pages: res.pages });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('common.error'));
      } finally {
        setIsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Seo
        title={t('search.soldHistoryTitle')}
        description={t('search.soldHistorySubtitle')}
        path="/sold-history"
        noIndex
      />

      <h1 className="page-title">🤝 {t('search.soldHistoryTitle')}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {t('search.soldHistorySubtitle')} · {t('search.results', { count: meta.total })}
      </p>

      <div className="mt-5">
        <ListingGrid
          listings={listings}
          isLoading={isLoading}
          error={error}
          onRetry={() => load(meta.page || 1)}
          emptyIcon="🤝"
          emptyTitle={t('search.soldHistoryTitle')}
          emptyDescription={t('search.noResultsText')}
          emptyActionLabel={t('buyer.browse')}
          onEmptyAction={() => window.location.assign('/listings')}
        />
      </div>

      {!isLoading && meta.pages > 1 && (
        <Pagination page={meta.page} pages={meta.pages} onChange={(page) => load(page)} />
      )}
    </div>
  );
}
