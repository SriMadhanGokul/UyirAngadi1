import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/AdminLayout';
import Seo from '../components/Seo';
import { adminService } from '../services';
import type { AdminStats } from '../types';

export default function AdminOverviewPage() {
  const { t } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void adminService.stats().then(setStats).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : translate.current('common.error'));
    });
  }, []);

  const cards = [
    { label: t('admin.totalUsers'), value: stats?.totalUsers ?? 0 },
    { label: t('admin.activeSellers', { defaultValue: 'Active Sellers' }), value: stats?.activeSellers ?? 0 },
    { label: t('admin.activeBuyers', { defaultValue: 'Active Buyers' }), value: stats?.activeBuyers ?? 0 },
    { label: t('admin.totalListings', { defaultValue: 'Total Listings' }), value: stats?.totalListings ?? 0 },
    { label: t('admin.pendingListings'), value: stats?.pendingListings ?? 0 },
    { label: t('admin.approvedListings', { defaultValue: 'Approved Listings' }), value: stats?.activeListings ?? 0 },
    { label: t('admin.soldListings'), value: stats?.soldListings ?? 0 },
    { label: t('admin.reportedListings'), value: stats?.reportedListings ?? 0 },
    { label: t('admin.suspendedUsers', { defaultValue: 'Suspended Users' }), value: stats?.suspendedUsers ?? 0 },
  ];
  const links = [
    { to: '/admin/users', label: t('admin.manageUsers', { defaultValue: 'Manage Users' }), detail: t('admin.userManagementDetail', { defaultValue: 'Search accounts, view activity, and suspend or reactivate users.' }) },
    { to: '/admin/listings', label: t('admin.manageListings', { defaultValue: 'Manage Listings' }), detail: t('admin.listingManagementDetail', { defaultValue: 'Review, edit, feature, change status, or remove listings.' }) },
    { to: '/admin/reports', label: t('admin.manageReports', { defaultValue: 'Manage Reports' }), detail: t('admin.reportManagementDetail', { defaultValue: 'Inspect reported listings and resolve moderation reports.' }) },
    { to: '/admin/categories', label: t('admin.manageCategoriesLocations', { defaultValue: 'Categories & Locations' }), detail: t('admin.catalogManagementDetail', { defaultValue: 'Manage animal categories and browse district listings.' }) },
  ];

  return (
    <AdminLayout title={t('admin.dashboard')}>
      <Seo title={t('admin.dashboard')} path="/admin" noIndex />
      {error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}
      <section aria-label={t('admin.dashboard')} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3">
        {cards.map((card) => <article key={card.label} className="card p-4"><p className="text-2xl font-extrabold text-neutral-900">{card.value}</p><p className="mt-1 text-xs font-medium text-neutral-600">{card.label}</p></article>)}
      </section>
      <section className="mt-6">
        <h2 className="section-title">{t('admin.quickLinks', { defaultValue: 'Administration' })}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {links.map((item) => <Link key={item.to} to={item.to} className="card flex min-h-28 flex-col justify-between p-4 transition-colors hover:border-brand-400"><span className="font-semibold text-neutral-900">{item.label}</span><span className="mt-2 text-sm text-neutral-600">{item.detail}</span><span className="mt-3 text-sm font-semibold text-brand-700">{t('common.open', { defaultValue: 'Open' })} →</span></Link>)}
        </div>
      </section>
    </AdminLayout>
  );
}
