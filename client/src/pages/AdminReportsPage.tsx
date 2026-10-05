import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { adminService } from '../services';
import type { Paginated, Report, ReportStatus } from '../types';

const PAGE_SIZE = 20;
const REPORT_STATUSES: ReportStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED'];

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Report> | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminService.reports({ status: status ? status as ReportStatus : undefined, page, limit: PAGE_SIZE }));
    } catch (err) {
      setError(err instanceof Error ? err.message : translate.current('common.error'));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (report: Report, next: ReportStatus) => {
    setBusyId(report._id);
    setError(null);
    try {
      const updated = await adminService.updateReport(report._id, next);
      setResult((current) => current ? { ...current, data: current.data.map((item) => item._id === updated._id ? updated : item) } : current);
      setSelected(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const listing = selected && typeof selected.listing === 'object' ? selected.listing : null;
  const reporter = selected && typeof selected.reporter === 'object' ? selected.reporter : null;
  const seller = listing && typeof listing.seller === 'object' ? listing.seller : null;

  return (
    <AdminLayout title={t('admin.reports')}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">{t('admin.reports')}</h2>
          <select className="field w-auto min-w-44" aria-label={t('admin.statusLabel', { defaultValue: 'Report status' })} value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}>
            <option value="">{t('admin.tabs.all')}</option>{REPORT_STATUSES.map((value) => <option key={value} value={value}>{t(`admin.${value === 'OPEN' ? 'open' : value === 'IN_REVIEW' ? 'inReview' : 'resolved'}`)}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <section className="card overflow-hidden">
          {loading ? <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p> : result?.data.length ? (
            <div className="divide-y divide-neutral-100">
              {result.data.map((report) => {
                const reportListing = typeof report.listing === 'object' ? report.listing : null;
                const reportReporter = typeof report.reporter === 'object' ? report.reporter : null;
                const reportSeller = reportListing && typeof reportListing.seller === 'object' ? reportListing.seller : null;
                return <article key={report._id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    {reportListing?.photos?.[0] && <img src={reportListing.photos[0]} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />}
                    <div className="min-w-0">
                      <button type="button" className="truncate text-left text-sm font-semibold text-brand-700 hover:underline" onClick={() => setSelected(report)}>{reportListing?.title || t('admin.listingUnavailable', { defaultValue: 'Listing unavailable' })}</button>
                      <p className="mt-0.5 text-xs text-neutral-600">{t('admin.reason')}: {report.reason} · {report.status}</p>
                      <p className="truncate text-xs text-neutral-500">{t('admin.reporter')}: {reportReporter?.name || reportReporter?.phone || '—'} · {t('admin.seller')}: {reportSeller?.name || reportSeller?.phone || '—'}</p>
                      {report.description && <p className="mt-1 line-clamp-2 text-xs text-neutral-600">{report.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-outline btn-sm" type="button" onClick={() => setSelected(report)}>{t('common.viewDetails', { defaultValue: 'Details' })}</button>
                    {report.status === 'OPEN' && <button className="btn-outline btn-sm" type="button" disabled={busyId === report._id} onClick={() => void updateStatus(report, 'IN_REVIEW')}>{t('admin.markInReview')}</button>}
                    {report.status !== 'RESOLVED' && <button className="btn-primary btn-sm" type="button" disabled={busyId === report._id} onClick={() => void updateStatus(report, 'RESOLVED')}>{t('admin.markResolved')}</button>}
                  </div>
                </article>;
              })}
            </div>
          ) : <p className="p-8 text-center text-sm text-neutral-500">{t('admin.noData')}</p>}
        </section>
        {result && result.pages > 1 && <Pagination page={page} pages={result.pages} onChange={setPage} />}
      </div>

      <Modal open={Boolean(selected)} title={t('admin.reportDetails', { defaultValue: 'Report details' })} onClose={() => setSelected(null)}>
        {selected && <div className="space-y-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2"><dt className="text-neutral-500">{t('admin.reason')}</dt><dd>{selected.reason}</dd><dt className="text-neutral-500">{t('admin.statusLabel', { defaultValue: 'Status' })}</dt><dd>{selected.status}</dd><dt className="text-neutral-500">{t('admin.reporter')}</dt><dd>{reporter?.name || reporter?.phone || '—'}</dd><dt className="text-neutral-500">{t('admin.seller')}</dt><dd>{seller?.name || seller?.phone || '—'}</dd></dl>
          <p className="whitespace-pre-wrap text-neutral-700">{selected.description || '—'}</p>
          {listing && <>
            <h3 className="font-semibold">{listing.title}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{listing.photos.map((photo) => <a key={photo} href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={listing.title} className="aspect-square w-full rounded-md object-cover" /></a>)}</div>
            {listing.video && <video controls className="max-h-64 w-full rounded-md" src={listing.video} />}
            <p className="text-neutral-600">{listing.category} · {listing.breed} · {listing.location.district}, {listing.location.taluk}, {listing.location.village}</p>
            <p className="whitespace-pre-wrap text-neutral-700">{listing.description}</p>
            <dl className="grid grid-cols-2 gap-2 text-xs">{Object.entries(listing.categorySpecificDetails || {}).map(([key, value]) => <div key={key}><dt className="text-neutral-500">{key}</dt><dd>{String(value)}</dd></div>)}</dl>
            <Link className="font-semibold text-brand-700 hover:underline" to={`/listings/${listing._id}`} onClick={() => setSelected(null)}>{t('admin.openListing', { defaultValue: 'Open listing' })}</Link>
            <Link className="ml-4 font-semibold text-brand-700 hover:underline" to={`/admin/listings?q=${encodeURIComponent(listing.title)}`} onClick={() => setSelected(null)}>{t('admin.manageListing', { defaultValue: 'Manage listing' })}</Link>
          </>}
        </div>}
      </Modal>
    </AdminLayout>
  );
}
