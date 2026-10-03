import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardLayout, { type NavItem } from '../layouts/DashboardLayout';
import Seo from '../components/Seo';
import StatusBadge from '../components/StatusBadge';
import { EmptyState } from '../components/Feedback';
import Pagination from '../components/Pagination';
import { adminService } from '../services';
import type { AdminStats, Listing } from '../types';
import { formatPrice, formatPublicLocation, timeAgo } from '../utils/format';

const PAGE_SIZE = 10;

const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: '/admin', labelKey: 'admin.dashboard', icon: '🛡', end: true },
  { to: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

const MODERATION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SOLD'] as const;

/** Admin console: platform stats + pending-listings moderation queue. */
export default function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [status, setStatus] = useState<(typeof MODERATION_STATUSES)[number]>('PENDING');
  const [listings, setListings] = useState<Listing[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(
    async (nextStatus: typeof status, nextPage: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsRes, listingsRes] = await Promise.all([
          adminService.stats(),
          adminService.listings({ status: nextStatus, page: nextPage, limit: PAGE_SIZE }),
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
    void load(status, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);


  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await adminService.approve(id);
      setListings((current) => current.filter((item) => item._id !== id));
      setStats((current) =>
        current
          ? { ...current, activeListings: current.activeListings + 1, pendingListings: Math.max(0, current.pendingListings - 1) }
          : current
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setBusyId(id);
    try {
      await adminService.reject(id, rejectReason.trim());
      setListings((current) => current.filter((item) => item._id !== id));
      setRejectId(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const feature = async (id: string) => {
    setBusyId(id);
    try {
      await adminService.feature(id, 7);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const cards = [
    { label: t('admin.totalUsers'), value: stats?.totalUsers ?? 0, icon: '👥' },
    { label: t('admin.activeListings'), value: stats?.activeListings ?? 0, icon: '✅' },
    { label: t('admin.pendingListings'), value: stats?.pendingListings ?? 0, icon: '⏳' },
    { label: t('admin.reportedListings'), value: stats?.reportedListings ?? 0, icon: '🚩' },
  ];


  return (
    <DashboardLayout items={ADMIN_NAV_ITEMS} title={t('admin.dashboard')}>
      <Seo title={t('admin.dashboard')} path="/admin" noIndex />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card p-4">
            <p className="text-2xl" aria-hidden>{card.icon}</p>
            <p className="mt-1 text-2xl font-extrabold text-neutral-900">{card.value}</p>
            <p className="text-xs font-medium text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
          <h2 className="section-title">{t('admin.moderateListings')}</h2>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('admin.moderateListings')}>
            {MODERATION_STATUSES.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={status === value}
                onClick={() => setStatus(value)}
                className={status === value ? 'chip bg-brand-600 !text-white' : 'chip'}
              >
                {t(`seller.status.${value}`, { defaultValue: value })}
              </button>
            ))}
          </div>
        </div>


        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">{t('common.loading')}</p>
        ) : listings.length === 0 ? (
          <div className="px-4 pb-6">
            <EmptyState icon="🛡" title={t('admin.moderateListings')} description={t('admin.noData')} />
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-neutral-100">
            {listings.map((listing) => (
              <li key={listing._id} className="px-4 py-3 sm:px-5">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/listings/${listing._id}`} className="truncate text-sm font-semibold text-neutral-900 hover:underline">
                    {listing.title}
                  </Link>
                  <StatusBadge status={listing.status} />
                </div>
                <p className="mt-0.5 text-sm font-bold text-brand-700">{formatPrice(listing.price)}</p>
                <p className="truncate text-xs text-neutral-500">
                  {formatPublicLocation(listing)} · {timeAgo(listing.createdAt, i18n.language)}
                </p>
                {rejectId === listing._id ? (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      autoFocus
                      className="field"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder={t('admin.rejectReasonPlaceholder')}
                    />
                    <div className="flex gap-1.5">
                      <button type="button" className="btn-danger btn-sm" disabled={busyId === listing._id} onClick={() => reject(listing._id)}>
                        {t('admin.reject')}
                      </button>
                      <button type="button" className="btn-ghost btn-sm" onClick={() => { setRejectId(null); setRejectReason(''); }}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {status === 'PENDING' && (
                      <>
                        <button type="button" className="btn-primary btn-sm" disabled={busyId === listing._id} onClick={() => approve(listing._id)}>
                          {t('admin.approve')}
                        </button>
                        <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => { setRejectId(listing._id); setRejectReason(''); }}>
                          {t('admin.reject')}
                        </button>
                      </>
                    )}
                    {status === 'APPROVED' && (
                      <button type="button" className="btn-outline btn-sm" disabled={busyId === listing._id} onClick={() => feature(listing._id)}>
                        ★ {t('admin.feature')}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pages > 1 && <Pagination page={page} pages={pages} onChange={(p) => load(status, p)} />}
    </DashboardLayout>
  );
}
