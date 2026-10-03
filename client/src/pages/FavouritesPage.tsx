import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import ListingGrid from '../components/ListingGrid';
import Pagination from '../components/Pagination';
import { favouriteService } from '../services';
import type { Listing } from '../types';

const PAGE_SIZE = 12;

/** Saved animals. Removes are optimistic with a rollback on failure. */
export default function FavouritesPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    favouriteService
      .list()
      .then((res) =>
        !cancelled && setItems(res.map((item) => item.listing).filter((listing) => Boolean(listing)))
      )
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common.error'));
      })
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (id: string) => {
    const previous = items;
    setItems((current) => current.filter((listing) => listing._id !== id));
    try {
      await favouriteService.remove(id);
    } catch {
      setItems(previous);
    }
  };

  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <Seo title={t('nav.favourites')} path="/favourites" noIndex />

      <h1 className="page-title">{t('nav.favourites')}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {t('listing.savedCount', { count: items.length, defaultValue: `${items.length} saved` })}
      </p>

      <div className="mt-5">
        <ListingGrid
          listings={visible}
          isLoading={isLoading}
          error={error}
          onRetry={() => window.location.reload()}
          emptyTitle={t('nav.favourites')}
          emptyDescription={t('search.noResultsText')}
          emptyActionLabel={t('buyer.browse')}
          savedListingIds={new Set(items.map((listing) => listing._id))}
          onToggleSave={remove}
        />
      </div>

      {!isLoading && pages > 1 && (
        <Pagination page={safePage} pages={pages} onChange={setPage} />
      )}

    </div>
  );
}
