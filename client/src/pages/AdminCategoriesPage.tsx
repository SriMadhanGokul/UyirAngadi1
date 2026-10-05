import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminLayout from '../components/AdminLayout';
import { adminService } from '../services';
import type { Category } from '../types';
import { TAMIL_NADU_DISTRICTS } from '../utils/constants';
import { getCategoryIcon } from '../utils/categoryIcons';

type CategoryForm = { key: string; nameEn: string; nameTa: string; icon: string; breeds: string; active: boolean };
const EMPTY_FORM: CategoryForm = { key: '', nameEn: '', nameTa: '', icon: '', breeds: '', active: true };

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setCategories(await adminService.categories()); }
    catch (err) { setError(err instanceof Error ? err.message : t('common.error')); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const beginEdit = (category: Category) => {
    setEditingId(category._id);
    setForm({
      key: category.key,
      nameEn: category.nameEn,
      nameTa: category.nameTa,
      icon: category.icon || '',
      breeds: category.breeds.map((breed) => `${breed.nameEn} | ${breed.nameTa}`).join('\n'),
      active: category.active,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const breeds = form.breeds.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [nameEn, nameTa] = line.split('|').map((part) => part.trim());
      return { key: nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), nameEn, nameTa: nameTa || nameEn };
    });
    if (breeds.some((breed) => !breed.nameEn)) {
      setError(t('admin.invalidBreeds', { defaultValue: 'Each breed needs a name.' }));
      setSaving(false);
      return;
    }
    try {
      const payload = { key: form.key.trim().toLowerCase(), nameEn: form.nameEn.trim(), nameTa: form.nameTa.trim(), icon: form.icon.trim(), breeds, active: form.active };
      if (editingId) await adminService.updateCategory(editingId, payload);
      else await adminService.createCategory(payload);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (category: Category) => {
    if (!window.confirm(t('admin.confirmDeleteCategory', { defaultValue: 'Delete this category? Categories used by listings cannot be deleted.' }))) return;
    setError(null);
    try {
      await adminService.deleteCategory(category._id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    }
  };

  return (
    <AdminLayout title={t('admin.manageCategoriesLocations', { defaultValue: 'Categories & Locations' })}>
      <div className="space-y-5">
        <section className="card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="section-title">{t('admin.categories')}</h2>{editingId && <button type="button" className="btn-ghost btn-sm" onClick={() => { setEditingId(null); setForm(EMPTY_FORM); }}>{t('common.cancel')}</button>}</div>
          {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-neutral-600">{t('admin.categoryKey')}<input required pattern="[a-z0-9-]+" className="field mt-1" value={form.key} onChange={(event) => setForm({ ...form, key: event.target.value })} /></label>
            <label className="text-xs text-neutral-600">{t('admin.icon', { defaultValue: 'Icon' })}<input className="field mt-1" maxLength={8} value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} /></label>
            <label className="text-xs text-neutral-600">{t('admin.categoryNameEn')}<input required className="field mt-1" value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })} /></label>
            <label className="text-xs text-neutral-600">{t('admin.categoryNameTa')}<input required className="field mt-1" value={form.nameTa} onChange={(event) => setForm({ ...form, nameTa: event.target.value })} /></label>
            <label className="text-xs text-neutral-600 sm:col-span-2">{t('admin.breeds')}<textarea className="field mt-1 min-h-28 font-mono text-xs" placeholder="Jersey | ஜெர்சி" value={form.breeds} onChange={(event) => setForm({ ...form, breeds: event.target.value })} /><span className="mt-1 block">{t('admin.breedFormat', { defaultValue: 'One breed per line: English name | Tamil name' })}</span></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />{t('admin.active')}</label>
            <button className="btn-primary sm:justify-self-end" type="submit" disabled={saving}>{t(editingId ? 'admin.saveCategory' : 'admin.addCategory')}</button>
          </form>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-3"><h2 className="section-title">{t('admin.categories')}</h2></div>
          {loading ? <p className="p-6 text-center text-sm text-neutral-500">{t('common.loading')}</p> : categories.length ? <div className="divide-y divide-neutral-100">
            {categories.map((category) => <article key={category._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center text-xl text-brand-600" aria-hidden>{getCategoryIcon(category.key)}</span><div><h3 className="font-semibold">{category.nameEn} · {category.nameTa}</h3><p className="text-xs text-neutral-500">{category.key} · {category.breeds.length} {t('admin.breeds').toLowerCase()} · {t(category.active ? 'admin.active' : 'admin.inactive', { defaultValue: category.active ? 'Active' : 'Inactive' })}</p><p className="mt-1 text-xs text-neutral-600">{category.breeds.map((breed) => breed.nameEn).join(', ')}</p></div></div>
              <div className="flex gap-2"><button type="button" className="btn-outline btn-sm" onClick={() => beginEdit(category)}><span className="inline-flex items-center gap-1.5"><FiEdit2 />{t('admin.edit', { defaultValue: 'Edit' })}</span></button><button type="button" className="btn-ghost btn-sm text-red-700" onClick={() => void remove(category)}><span className="inline-flex items-center gap-1.5"><FiTrash2 />{t('admin.delete')}</span></button></div>
            </article>)}
          </div> : <p className="p-6 text-center text-sm text-neutral-500">{t('admin.noData')}</p>}
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="section-title">{t('admin.locations', { defaultValue: 'Tamil Nadu locations' })}</h2>
          <p className="mt-1 text-sm text-neutral-600">{t('admin.locationsDescription', { defaultValue: 'Browse current listings by district. District names follow the marketplace directory.' })}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{TAMIL_NADU_DISTRICTS.map((district) => <Link key={district} className="rounded-md border border-neutral-200 px-3 py-2 text-sm hover:border-brand-500 hover:text-brand-700" to={`/admin/listings?district=${encodeURIComponent(district)}`}>{district}</Link>)}</div>
        </section>
      </div>
    </AdminLayout>
  );
}
