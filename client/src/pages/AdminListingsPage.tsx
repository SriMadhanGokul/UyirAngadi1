import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from '../components/AdminLayout';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import { categoryService, adminService } from '../services';
import type { AdminListingFilters, Category, Listing, ListingStatus, Paginated } from '../types';
import { formatPrice, formatPublicLocation, timeAgo } from '../utils/format';

const PAGE_SIZE = 20;
const STATUSES: ListingStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SOLD'];
type FilterDraft = { q: string; status: string; category: string; district: string; seller: string; dateFrom: string; dateTo: string };
type ListingDraft = { category: string; breed: string; title: string; description: string; gender: string; ageYears: string; ageMonths: string; price: string; isNegotiable: boolean; phone: string; whatsapp: string; district: string; taluk: string; village: string; pincode: string; healthInfo: string; vaccinationInfo: string; details: string };

function makeDraft(listing: Listing): ListingDraft {
  return {
    category: listing.category,
    breed: listing.breed || '',
    title: listing.title || '',
    description: listing.description || '',
    gender: listing.gender || 'Other',
    ageYears: String(listing.age?.years ?? ''),
    ageMonths: String(listing.age?.months ?? ''),
    price: String(listing.price),
    isNegotiable: listing.isNegotiable,
    phone: listing.phone || '',
    whatsapp: listing.whatsapp || '',
    district: listing.location.district,
    taluk: listing.location.taluk,
    village: listing.location.village,
    pincode: listing.location.pincode,
    healthInfo: listing.healthInfo || '',
    vaccinationInfo: listing.vaccinationInfo || '',
    details: JSON.stringify(listing.categorySpecificDetails || {}, null, 2),
  };
}

export default function AdminListingsPage() {
  const { t, i18n } = useTranslation();
  const translate = useRef(t);
  translate.current = t;
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<FilterDraft>({
    q: '', status: '', category: '', district: searchParams.get('district') || '', seller: '', dateFrom: '', dateTo: '',
  });
  const [applied, setApplied] = useState<AdminListingFilters>({ district: searchParams.get('district') || undefined });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Listing> | null>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [nextStatus, setNextStatus] = useState<ListingStatus>('APPROVED');
  const [soldPrice, setSoldPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await adminService.listings({ ...applied, page, limit: PAGE_SIZE }));
    } catch (err) {
      setError(err instanceof Error ? err.message : translate.current('common.error'));
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void categoryService.list().then(setCategories).catch(() => setCategories([])); }, []);

  const submitFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    const next = {
      q: filters.q.trim() || undefined,
      status: filters.status ? filters.status as ListingStatus : undefined,
      category: filters.category || undefined,
      district: filters.district.trim() || undefined,
      seller: filters.seller.trim() || undefined,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
    };
    setApplied(next);
    if (next.district) setSearchParams({ district: next.district });
    else setSearchParams({});
  };

  const openDetails = (listing: Listing) => {
    setSelected(listing);
    setDraft(makeDraft(listing));
    setRejectReason('');
    setNextStatus(listing.status === 'SOLD' ? 'APPROVED' : listing.status);
    setSoldPrice(listing.soldPrice === undefined ? '' : String(listing.soldPrice));
  };

  const saveDetails = async () => {
    if (!selected || !draft) return;
    let details: Record<string, unknown>;
    try {
      details = JSON.parse(draft.details || '{}') as Record<string, unknown>;
      if (!details || Array.isArray(details) || typeof details !== 'object') throw new Error('Details must be a JSON object.');
    } catch {
      setError(t('admin.invalidDetails', { defaultValue: 'Category details must be valid JSON.' }));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await adminService.updateListing(selected._id, {
        category: draft.category,
        breed: draft.breed.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        gender: draft.gender,
        age: draft.ageYears || draft.ageMonths ? { years: Number(draft.ageYears) || 0, months: Number(draft.ageMonths) || 0 } : undefined,
        price: Number(draft.price),
        isNegotiable: draft.isNegotiable,
        phone: draft.phone.trim(),
        whatsapp: draft.whatsapp.trim(),
        location: { district: draft.district.trim(), taluk: draft.taluk.trim(), village: draft.village.trim(), pincode: draft.pincode.trim() },
        categorySpecificDetails: details,
        healthInfo: draft.healthInfo.trim(),
        vaccinationInfo: draft.vaccinationInfo.trim(),
      });
      setSelected(updated);
      setDraft(makeDraft(updated));
      setResult((current) => current ? { ...current, data: current.data.map((item) => item._id === updated._id ? { ...item, ...updated } : item) } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (status: ListingStatus) => {
    if (!selected) return;
    if (status === 'REJECTED' && rejectReason.trim().length < 3) {
      setError(t('admin.rejectReasonPlaceholder'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await adminService.setListingStatus(selected._id, {
        status,
        rejectionReason: status === 'REJECTED' ? rejectReason.trim() : undefined,
        soldPrice: status === 'SOLD' && soldPrice ? Number(soldPrice) : undefined,
      });
      setSelected(updated);
      setResult((current) => current ? { ...current, data: current.data.map((item) => item._id === updated._id ? { ...item, ...updated } : item) } : current);
      setNextStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await adminService.setFeatured(selected._id, !selected.isFeatured);
      setSelected(updated);
      setResult((current) => current ? { ...current, data: current.data.map((item) => item._id === updated._id ? { ...item, ...updated } : item) } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async () => {
    if (!selected || !window.confirm(t('admin.confirmDelete'))) return;
    setSaving(true);
    try {
      await adminService.removeListing(selected._id);
      setSelected(null);
      setDraft(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const setDraftValue = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };
  const seller = selected && typeof selected.seller === 'object' ? selected.seller : null;

  return (
    <AdminLayout title={t('admin.listings')}>
      <div className="space-y-4">
        <form onSubmit={submitFilters} className="card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <input className="field" placeholder={t('admin.searchListings', { defaultValue: 'Title, breed, or phone' })} aria-label={t('admin.searchListings', { defaultValue: 'Search listings' })} value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} />
          <select className="field" aria-label={t('admin.statusLabel', { defaultValue: 'Status' })} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="">{t('admin.tabs.all')}</option>{STATUSES.map((status) => <option key={status} value={status}>{t(`listing.status.${status}`, { defaultValue: status })}</option>)}
          </select>
          <select className="field" aria-label={t('listing.category')} value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="">{t('admin.allCategories', { defaultValue: 'All categories' })}</option>{categories.map((category) => <option key={category._id} value={category.key}>{i18n.language.startsWith('ta') ? category.nameTa : category.nameEn}</option>)}
          </select>
          <input className="field" placeholder={t('admin.district', { defaultValue: 'District' })} aria-label={t('admin.district', { defaultValue: 'District' })} value={filters.district} onChange={(event) => setFilters({ ...filters, district: event.target.value })} />
          <input className="field" placeholder={t('admin.sellerFilter', { defaultValue: 'Seller ID or phone' })} aria-label={t('admin.sellerFilter', { defaultValue: 'Seller' })} value={filters.seller} onChange={(event) => setFilters({ ...filters, seller: event.target.value })} />
          <label className="text-xs text-neutral-600">{t('admin.dateFrom', { defaultValue: 'From' })}<input className="field mt-1" type="date" value={filters.dateFrom} onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })} /></label>
          <label className="text-xs text-neutral-600">{t('admin.dateTo', { defaultValue: 'To' })}<input className="field mt-1" type="date" value={filters.dateTo} onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })} /></label>
          <button className="btn-primary self-end" type="submit">{t('common.search', { defaultValue: 'Apply filters' })}</button>
        </form>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <section className="card overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-3"><h2 className="section-title">{t('admin.listings', { defaultValue: 'Manage Listings' })} <span className="text-sm font-normal text-neutral-500">{result?.total ?? ''}</span></h2></div>
          {loading ? <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p> : result?.data.length ? (
            <div className="overflow-x-auto"><table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="px-4 py-3">{t('listing.animal', { defaultValue: 'Listing' })}</th><th className="px-4 py-3">{t('admin.seller')}</th><th className="px-4 py-3">{t('admin.district', { defaultValue: 'District' })}</th><th className="px-4 py-3">{t('listing.price')}</th><th className="px-4 py-3">{t('admin.statusLabel', { defaultValue: 'Status' })}</th><th className="px-4 py-3">{t('admin.actions')}</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">{result.data.map((listing) => {
                const itemSeller = typeof listing.seller === 'object' ? listing.seller : null;
                return <tr key={listing._id}>
                  <td className="px-4 py-3"><p className="font-semibold">{listing.title}</p><p className="text-xs text-neutral-500">{listing.category} · {listing.breed} · {timeAgo(listing.createdAt, i18n.language)}</p></td>
                  <td className="px-4 py-3">{itemSeller?.name || listing.phone}<p className="text-xs text-neutral-500">{itemSeller?.phone || ''}</p></td>
                  <td className="px-4 py-3">{formatPublicLocation(listing)}</td><td className="px-4 py-3">{formatPrice(listing.price)}</td><td className="px-4 py-3"><StatusBadge status={listing.status} /></td>
                  <td className="px-4 py-3"><button className="btn-outline btn-sm" type="button" onClick={() => openDetails(listing)}>{t('common.viewDetails', { defaultValue: 'Details' })}</button></td>
                </tr>;
              })}</tbody>
            </table></div>
          ) : <p className="p-8 text-center text-sm text-neutral-500">{t('admin.noData')}</p>}
        </section>
        {result && result.pages > 1 && <Pagination page={page} pages={result.pages} onChange={setPage} />}
      </div>

      <Modal open={Boolean(selected)} title={selected?.title || t('admin.listings')} onClose={() => { setSelected(null); setDraft(null); }}>
        {selected && draft && <div className="space-y-5">
          <section>
            <h3 className="mb-2 text-sm font-bold">{t('admin.preview', { defaultValue: 'Listing preview' })}</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{selected.photos.map((photo) => <a key={photo} href={photo} target="_blank" rel="noreferrer"><img src={photo} alt={selected.title} className="aspect-square w-full rounded-md object-cover" /></a>)}</div>
            {selected.video && <video controls className="mt-3 max-h-64 w-full rounded-md" src={selected.video}>{t('listing.videoUnavailable', { defaultValue: 'Video unavailable' })}</video>}
            <p className="mt-2 text-sm text-neutral-600">{seller?.name || t('admin.seller')} · {seller?.phone || selected.phone} · {formatPublicLocation(selected)}</p>
            <p className="mt-1 text-sm text-neutral-600">{selected.description}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">{Object.entries(selected.categorySpecificDetails || {}).map(([key, value]) => <Fragment key={key}><dt className="text-neutral-500">{key}</dt><dd>{String(value)}</dd></Fragment>)}</dl>
          </section>
          <section className="grid gap-3 border-t border-neutral-100 pt-4 sm:grid-cols-2">
            <label className="text-xs text-neutral-600">{t('listing.category')}<select className="field mt-1" value={draft.category} onChange={(e) => setDraftValue('category', e.target.value)}>{categories.map((category) => <option key={category._id} value={category.key}>{category.nameEn}</option>)}</select></label>
            <label className="text-xs text-neutral-600">{t('listing.breed')}<input className="field mt-1" value={draft.breed} onChange={(e) => setDraftValue('breed', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.title')}<input className="field mt-1" value={draft.title} onChange={(e) => setDraftValue('title', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.price')}<input className="field mt-1" type="number" min="0" value={draft.price} onChange={(e) => setDraftValue('price', e.target.value)} /></label>
            <label className="text-xs text-neutral-600 sm:col-span-2">{t('listing.description')}<textarea className="field mt-1 min-h-20" value={draft.description} onChange={(e) => setDraftValue('description', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.gender')}<select className="field mt-1" value={draft.gender} onChange={(e) => setDraftValue('gender', e.target.value)}>{['Male', 'Female', 'Other'].map((gender) => <option key={gender}>{gender}</option>)}</select></label>
            <label className="text-xs text-neutral-600">{t('listing.age')}<div className="flex gap-2"><input className="field mt-1" type="number" min="0" aria-label="Age years" placeholder="Years" value={draft.ageYears} onChange={(e) => setDraftValue('ageYears', e.target.value)} /><input className="field mt-1" type="number" min="0" max="11" aria-label="Age months" placeholder="Months" value={draft.ageMonths} onChange={(e) => setDraftValue('ageMonths', e.target.value)} /></div></label>
            <label className="text-xs text-neutral-600">{t('auth.phone')}<input className="field mt-1" inputMode="numeric" value={draft.phone} onChange={(e) => setDraftValue('phone', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">WhatsApp<input className="field mt-1" inputMode="numeric" value={draft.whatsapp} onChange={(e) => setDraftValue('whatsapp', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('admin.district', { defaultValue: 'District' })}<input className="field mt-1" value={draft.district} onChange={(e) => setDraftValue('district', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.taluk', { defaultValue: 'Taluk' })}<input className="field mt-1" value={draft.taluk} onChange={(e) => setDraftValue('taluk', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.village', { defaultValue: 'Village' })}<input className="field mt-1" value={draft.village} onChange={(e) => setDraftValue('village', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.pincode', { defaultValue: 'Pincode' })}<input className="field mt-1" inputMode="numeric" value={draft.pincode} onChange={(e) => setDraftValue('pincode', e.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isNegotiable} onChange={(e) => setDraftValue('isNegotiable', e.target.checked)} />{t('listing.negotiable', { defaultValue: 'Price negotiable' })}</label>
            <label className="text-xs text-neutral-600 sm:col-span-2">{t('listing.categoryDetails', { defaultValue: 'Category-specific details (JSON)' })}<textarea className="field mt-1 min-h-24 font-mono text-xs" value={draft.details} onChange={(e) => setDraftValue('details', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.healthInfo', { defaultValue: 'Health info' })}<input className="field mt-1" value={draft.healthInfo} onChange={(e) => setDraftValue('healthInfo', e.target.value)} /></label>
            <label className="text-xs text-neutral-600">{t('listing.vaccinationInfo', { defaultValue: 'Vaccination info' })}<input className="field mt-1" value={draft.vaccinationInfo} onChange={(e) => setDraftValue('vaccinationInfo', e.target.value)} /></label>
          </section>
          <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
            <button type="button" className="btn-primary btn-sm" disabled={saving} onClick={() => void saveDetails()}>{t('admin.saveChanges', { defaultValue: 'Save listing edits' })}</button>
            <button type="button" className="btn-outline btn-sm" disabled={saving} onClick={() => void toggleFeatured()}>{selected.isFeatured ? t('admin.unfeature', { defaultValue: 'Unfeature' }) : t('admin.feature')}</button>
            <button type="button" className="btn-danger btn-sm" disabled={saving} onClick={() => void deleteListing()}>{t('admin.delete')}</button>
          </div>
          <div className="grid gap-2 border-t border-neutral-100 pt-4 sm:grid-cols-[1fr_auto_auto]">
            <div className="flex flex-wrap gap-2">
              {selected.status === 'PENDING' && <button className="btn-primary btn-sm" type="button" disabled={saving} onClick={() => void changeStatus('APPROVED')}>{t('admin.approve')}</button>}
              <select className="field" aria-label={t('admin.changeStatus', { defaultValue: 'Change listing status' })} value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ListingStatus)}>{STATUSES.map((status) => <option key={status} value={status}>{t(`listing.status.${status}`, { defaultValue: status })}</option>)}</select>
              <button className="btn-outline btn-sm" type="button" disabled={saving} onClick={() => void changeStatus(nextStatus)}>{t('admin.updateStatus', { defaultValue: 'Update status' })}</button>
            </div>
            {nextStatus === 'REJECTED' && <input className="field" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={t('admin.rejectReasonPlaceholder')} />}
            {nextStatus === 'SOLD' && <input className="field" type="number" min="0" value={soldPrice} onChange={(event) => setSoldPrice(event.target.value)} placeholder={t('listing.price')} />}
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>}
      </Modal>
    </AdminLayout>
  );
}
