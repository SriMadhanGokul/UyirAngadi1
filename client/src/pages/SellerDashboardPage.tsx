import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout, { type NavItem } from '../layouts/DashboardLayout';
import Seo from '../components/Seo';
import StatusBadge from '../components/StatusBadge';
import { EmptyState } from '../components/Feedback';
import Pagination from '../components/Pagination';
import listingService, { sellerService } from '../services/listingService';
import type { Listing, SellerStats } from '../types';
import { formatPrice, formatPublicLocation } from '../utils/format';

const PAGE_SIZE = 10;

const SELLER_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'seller.dashboard', icon: '📊', end: true },
  { to: '/favourites', labelKey: 'nav.favourites', icon: '♥' },
  { to: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

type ConfirmState = { kind: 'delete' | 'sold'; listing: Listing } | null;

/** Seller home: stat cards + own listings with edit / sold / delete actions. */
export default function SellerDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [soldPrice, setSoldPrice] = useState('');

  const load = useCallback(
    async (nextPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsRes, listingsRes] = await Promise.all([
          sellerService.stats(),
          sellerService.listings({ page: nextPage, limit: PAGE_SIZE }),
        ]);
        setStats(statsRes);
        setListings(listingsRes.data);
        setPages(listingsRes.pages);
        setPage(listingsRes.page);
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


  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await listingService.remove(id);
      setListings((current) => current.filter((item) => item._id !== id));
      setConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkSold = async (id: string) => {
    setBusyId(id);
    try {
      const amount = soldPrice.trim() ? Number(soldPrice) : undefined;
      const updated = await sellerService.markSold(id, amount);
      setListings((current) =>
        current.map((item) =>
          item._id === id
            ? { ...item, status: updated.status, soldPrice: updated.soldPrice }
            : item
        )
      );
      setStats((current) =>
        current
          ? {
              ...current,
              activeListingsCount: Math.max(0, current.activeListingsCount - 1),
              soldListingsCount: current.soldListingsCount + 1,
            }
          : current
      );
      setConfirm(null);
      setSoldPrice('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const cards = [
    { label: t('seller.activeListings'), value: stats?.activeListingsCount ?? 0, icon: '✅' },
    { label: t('seller.pendingApproval'), value: stats?.pendingListingsCount ?? 0, icon: '⏳' },
    { label: t('seller.sold'), value: stats?.soldListingsCount ?? 0, icon: '🤝' },
    { label: t('seller.totalEnquiries'), value: stats?.totalEnquiriesCount ?? 0, icon: '💬' },
  ];


  return (
    <DashboardLayout
      items={SELLER_NAV_ITEMS}
      title={t('seller.dashboard')}
      actions={
        <>
          <Link to="#my-listings" className="btn-outline btn-sm">
            {t('seller.manageListings')}
          </Link>
          <Link to="/sell" className="btn-primary btn-sm">
            + {t('seller.addListing')}
          </Link>
        </>
      }
    >
      <Seo title={t('seller.dashboard')} path="/dashboard" noIndex />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-2xl" aria-hidden>
              {card.icon}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-neutral-900">{card.value}</p>
            <p className="text-xs font-medium text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div id="my-listings" className="card mt-5 overflow-hidden">
        <h2 className="section-title px-4 pt-4 sm:px-5">{t('seller.myListings')}</h2>
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">{t('common.loading')}</p>
        ) : listings.length === 0 ? (
          <div className="px-4 pb-6">
            <EmptyState icon="🐄" title={t('seller.noListings')} description={t('seller.createFirst')} />
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {listings.map((listing) => (
              <li key={listing._id} className="flex gap-3 px-4 py-3 sm:px-5">
                <Link to={`/listings/${listing._id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {listing.photos[0] ? (
                    <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-2xl">🐾</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/listings/${listing._id}`} className="truncate text-sm font-semibold text-neutral-900 hover:underline">
                      {listing.title}
                    </Link>
                    <StatusBadge status={listing.status} />
                  </div>
                  <p className="mt-0.5 text-sm font-bold text-brand-700">
                    {formatPrice(listing.price)}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {formatPublicLocation(listing)} · 👁 {listing.views}
                  </p>
                  {listing.status === 'SOLD' && listing.soldPrice !== undefined && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      {t('seller.soldFor')}: {formatPrice(listing.soldPrice)}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Link to={`/sell/${listing._id}`} className="btn-outline btn-sm">
                      {t('seller.edit')}
                    </Link>
                    {listing.status !== 'SOLD' && (
                      <button type="button" disabled={busyId === listing._id} onClick={() => { setSoldPrice(''); setConfirm({ kind: 'sold', listing }); }} className="btn-outline btn-sm">
                        {t('seller.markSold')}
                      </button>
                    )}
                    <button type="button" disabled={busyId === listing._id} onClick={() => setConfirm({ kind: 'delete', listing })} className="btn-ghost btn-sm text-red-600">
                      {t('seller.delete')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && <Pagination page={page} pages={pages} onChange={(p) => load(p)} />}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="card w-full max-w-sm p-5">
            <h3 className="text-base font-bold text-neutral-900">
              {confirm.kind === 'delete' ? t('seller.confirmDelete') : t('seller.confirmSold')}
            </h3>
            <p className="mt-1 truncate text-sm text-neutral-600">{confirm.listing.title}</p>
            {confirm.kind === 'sold' && (
              <div className="mt-4">
                <label htmlFor="seller-sold-price" className="field-label">
                  {t('seller.soldPriceOptional')}
                </label>
                <input
                  id="seller-sold-price"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  className="field"
                  value={soldPrice}
                  onChange={(event) => setSoldPrice(event.target.value)}
                  placeholder="₹"
                />
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setConfirm(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className={confirm.kind === 'delete' ? 'btn-danger' : 'btn-primary'}
                disabled={busyId === confirm.listing._id}
                onClick={() => confirm.kind === 'delete' ? handleDelete(confirm.listing._id) : handleMarkSold(confirm.listing._id)}
              >
                {confirm.kind === 'delete' ? t('seller.delete') : t('seller.markSold')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
