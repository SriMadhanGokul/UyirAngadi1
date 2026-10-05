import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { adminService } from '../services';
import type { AdminUserFilters, Paginated, UserWithStats } from '../types';

const PAGE_SIZE = 20;
const EMPTY_FILTERS = { q: '', role: '', district: '', status: '' };

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState<AdminUserFilters>({});
  const [result, setResult] = useState<Paginated<UserWithStats> | null>(null);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<UserWithStats | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminService.users({ ...applied, page, limit: PAGE_SIZE }));
    } catch (err) {
      setError(err instanceof Error ? err.message : translate.current('common.error'));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { void load(); }, [load]);

  const submitFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setApplied({
      q: filters.q.trim() || undefined,
      role: filters.role ? filters.role as AdminUserFilters['role'] : undefined,
      district: filters.district.trim() || undefined,
      status: filters.status ? filters.status as AdminUserFilters['status'] : undefined,
    });
  };

  const toggleSuspension = async (user: UserWithStats) => {
    const isSuspended = !user.isSuspended;
    setBusyId(user._id);
    setError(null);
    try {
      await adminService.suspendUser(user._id, isSuspended);
      setResult((current) => current ? {
        ...current,
        data: current.data.map((item) => item._id === user._id ? { ...item, isSuspended } : item),
      } : current);
      setSelected((current) => current?._id === user._id ? { ...current, isSuspended } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (user: UserWithStats) => {
    const confirmed = window.confirm(`Delete ${user.name || 'this user'} permanently? This will remove the account and all related listings, enquiries, favourites, and reports.`);
    if (!confirmed) return;

    setBusyId(user._id);
    setError(null);
    try {
      await adminService.deleteUser(user._id);
      setResult((current) => current ? {
        ...current,
        data: current.data.filter((item) => item._id !== user._id),
        total: Math.max(0, current.total - 1),
      } : current);
      setSelected((current) => (current?._id === user._id ? null : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminLayout title={t('admin.users')}>
      <div className="space-y-4">
        <form onSubmit={submitFilters} className="card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
          <input className="field" aria-label={t('admin.searchUsers', { defaultValue: 'Search users' })} placeholder={t('admin.searchUsers', { defaultValue: 'Name or phone' })} value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
          <select className="field" aria-label={t('admin.role')} value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
            <option value="">{t('admin.allRoles', { defaultValue: 'All roles' })}</option>
            <option value="USER">{t('admin.user', { defaultValue: 'User' })}</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input className="field" aria-label={t('admin.district', { defaultValue: 'District' })} placeholder={t('admin.district', { defaultValue: 'District' })} value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} />
          <select className="field" aria-label={t('admin.statusFilter', { defaultValue: 'Account status' })} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">{t('admin.allStatuses', { defaultValue: 'All statuses' })}</option>
            <option value="ACTIVE">{t('admin.active')}</option>
            <option value="SUSPENDED">{t('admin.suspended')}</option>
          </select>
          <button className="btn-primary" type="submit">{t('common.search', { defaultValue: 'Apply filters' })}</button>
        </form>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <section className="card overflow-hidden" aria-label={t('admin.users')}>
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <h2 className="section-title">{t('admin.users')} <span className="text-sm font-normal text-neutral-500">{result?.total ?? ''}</span></h2>
          </div>
          {loading ? <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p> : result?.data.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
                  <tr><th className="px-4 py-3">{t('auth.name')}</th><th className="px-4 py-3">{t('auth.phone')}</th><th className="px-4 py-3">{t('admin.role')}</th><th className="px-4 py-3">{t('admin.district', { defaultValue: 'District' })}</th><th className="px-4 py-3">{t('admin.listingsCount')}</th><th className="px-4 py-3">{t('admin.statusLabel', { defaultValue: 'Status' })}</th><th className="px-4 py-3">{t('admin.actions')}</th></tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {result.data.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-3"><button className="font-semibold text-brand-700 hover:underline" onClick={() => setSelected(user)}>{user.name || t('admin.unnamed', { defaultValue: 'Unnamed user' })}</button><div className="text-xs text-neutral-500">{user.enquiriesCount} {t('admin.enquiries', { defaultValue: 'enquiries' })}</div></td>
                      <td className="px-4 py-3">{user.phone}</td>
                      <td className="px-4 py-3">{user.role === 'ADMIN' ? 'Admin' : user.listingsCount ? t('admin.seller', { defaultValue: 'Seller' }) : t('admin.buyer', { defaultValue: 'Buyer' })}</td>
                      <td className="px-4 py-3">{user.location?.district || '—'}</td>
                      <td className="px-4 py-3">{user.listingsCount}</td>
                      <td className="px-4 py-3"><span className={user.isSuspended ? 'font-medium text-red-700' : 'font-medium text-emerald-700'}>{t(user.isSuspended ? 'admin.suspended' : 'admin.active')}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={user.isSuspended ? 'btn-outline btn-sm' : 'btn-ghost btn-sm text-red-700'} disabled={user.role === 'ADMIN' || busyId === user._id} onClick={() => void toggleSuspension(user)}>{t(user.isSuspended ? 'admin.unsuspend' : 'admin.suspend')}</button>
                          <button type="button" className="btn-ghost btn-sm text-red-700" disabled={user.role === 'ADMIN' || busyId === user._id} onClick={() => void deleteUser(user)}>Delete permanently</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="p-8 text-center text-sm text-neutral-500">{t('admin.noData')}</p>}
        </section>
        {result && result.pages > 1 && <Pagination page={page} pages={result.pages} onChange={setPage} />}
      </div>

      <Modal open={Boolean(selected)} title={selected?.name || t('admin.unnamed', { defaultValue: 'User details' })} onClose={() => setSelected(null)} footer={selected ? (
        <>
          <button type="button" className="btn-outline btn-sm" onClick={() => setSelected(null)}>{t('common.close')}</button>
          {selected.role !== 'ADMIN' && (
            <button type="button" className="btn-ghost btn-sm text-red-700" disabled={busyId === selected._id} onClick={() => void deleteUser(selected)}>
              Delete permanently
            </button>
          )}
        </>
      ) : undefined}>
        {selected && <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-neutral-500">{t('auth.phone')}</dt><dd>{selected.phone}</dd>
          <dt className="text-neutral-500">{t('admin.role')}</dt><dd>{selected.role}</dd>
          <dt className="text-neutral-500">{t('admin.district', { defaultValue: 'District' })}</dt><dd>{selected.location?.district || '—'}</dd>
          <dt className="text-neutral-500">{t('admin.location', { defaultValue: 'Location' })}</dt><dd>{[selected.location?.taluk, selected.location?.village].filter(Boolean).join(', ') || '—'}</dd>
          <dt className="text-neutral-500">{t('admin.joined', { defaultValue: 'Joined' })}</dt><dd>{new Date(selected.createdAt).toLocaleDateString()}</dd>
          <dt className="text-neutral-500">{t('admin.listingsCount')}</dt><dd>{selected.listingsCount}</dd>
          <dt className="text-neutral-500">{t('admin.enquiries', { defaultValue: 'Enquiries made' })}</dt><dd>{selected.enquiriesCount}</dd>
          <dt className="text-neutral-500">{t('admin.statusLabel', { defaultValue: 'Status' })}</dt><dd>{t(selected.isSuspended ? 'admin.suspended' : 'admin.active')}</dd>
        </dl>}
      </Modal>
    </AdminLayout>
  );
}
