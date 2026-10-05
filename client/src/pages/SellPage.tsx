import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiPhoneCall } from 'react-icons/fi';
import Seo from '../components/Seo';
import PhotoUploader from '../components/PhotoUploader';
import type { RejectedFile } from '../components/PhotoUploader';
import { ErrorBanner, Spinner, SuccessBanner } from '../components/Feedback';
import { categoryService } from '../services';
import listingService from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import type { Category, Gender, ListingFormValues } from '../types';
import {
  CATEGORY_DETAIL_FIELDS,
  GENDERS,
  TAMIL_NADU_DISTRICTS,
  getDetailFieldLabel,
  type CategoryDetailField as DetailField,
} from '../utils/constants';
import { formatAge, makeObjectUrls, revokeObjectUrls } from '../utils/format';

type AgeUnit = 'years' | 'months';

function parseAgeInput(value: string, unit: AgeUnit) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (unit === 'months') {
    if (!/^\d+$/.test(trimmed)) return null;
    const totalMonths = Number(trimmed);
    if (!Number.isSafeInteger(totalMonths)) return null;
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
  }

  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const years = Number(match[1]);
  const months = Number(match[2] ?? 0);
  if (!Number.isSafeInteger(years) || months > 11) return null;
  return { years, months };
}

const EMPTY_FORM: ListingFormValues = {
  category: '',
  breed: '',
  title: '',
  description: '',
  gender: '',
  ageYears: '',
  ageMonths: '',
  price: '',
  isNegotiable: true,
  phone: '',
  whatsapp: '',
  district: '',
  taluk: '',
  village: '',
  pincode: '',
  healthInfo: '',
  vaccinationInfo: '',
  details: {},
  photos: [],
  video: null,
};

/** Shared create/edit form. `/sell` creates, `/sell/:id` edits. */
export default function SellPage() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = Boolean(id);
  const isTamil = i18n.language?.startsWith('ta');

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ListingFormValues>({
    ...EMPTY_FORM,
    phone: user?.phone ?? '',
  });
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years');
  const [previews, setPreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  /** WhatsApp defaults to the contact phone unless the seller opts out. */
  const [sameAsPhone, setSameAsPhone] = useState(true);

  const selectedCategory = categories.find((c) => c.key === form.category);
  const detailFields: DetailField[] = useMemo(
    () => CATEGORY_DETAIL_FIELDS[form.category] ?? [],
    [form.category]
  );

  useEffect(() => {
    categoryService
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Keep object URLs in sync with the selected files.
  useEffect(() => {
    setPreviews((prev) => {
      revokeObjectUrls(prev);
      return makeObjectUrls(form.photos);
    });
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.photos]);

  useEffect(() => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(form.video ? URL.createObjectURL(form.video) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.video]);

  /** Prefills the form when editing an existing listing. */
  useEffect(() => {
    if (!id) return;
    listingService
      .getById(id)
      .then((res) => {
        const listing = res.data;
        setForm({
          category: listing.category,
          breed: listing.breed ?? '',
          title: listing.title,
          description: listing.description,
          gender: listing.gender ?? '',
          ageYears: String(listing.age?.years ?? ''),
          ageMonths: String(listing.age?.months ?? ''),
          price: String(listing.price),
          isNegotiable: listing.isNegotiable,
          phone: listing.phone ?? user?.phone ?? '',
          whatsapp: listing.whatsapp ?? '',
          district: listing.location?.district ?? '',
          taluk: listing.location?.taluk ?? '',
          village: listing.location?.village ?? '',
          pincode: listing.location?.pincode ?? '',
          healthInfo: listing.healthInfo ?? '',
          vaccinationInfo: listing.vaccinationInfo ?? '',
          details: Object.fromEntries(
            Object.entries(listing.categorySpecificDetails ?? {}).map(([key, value]) => [
              key,
              typeof value === 'boolean' ? String(value) : String(value ?? ''),
            ])
          ),
          photos: [],
          video: null,
        });
        const years = listing.age?.years ?? 0;
        const months = listing.age?.months ?? 0;
        if (years === 0 && months > 0) {
          setAgeUnit('months');
          setAgeValue(String(months));
        } else {
          setAgeUnit('years');
          setAgeValue(`${years}${months > 0 ? `.${months}` : ''}`);
        }
        setExistingPhotos(listing.photos ?? []);
        setPreviews([]);
        setExistingVideo(listing.video ?? null);
        setRemoveExistingVideo(false);
        setSameAsPhone(
          !listing.whatsapp || listing.whatsapp === (listing.phone ?? user?.phone ?? '')
        );
      })
      .catch((err: unknown) =>
        setFormError(err instanceof Error ? err.message : t('common.error'))
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = <K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setDetail = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, details: { ...prev.details, [name]: value } }));

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.category) next.category = t('sell.errors.category');
    if (!form.breed.trim()) next.breed = t('sell.errors.breed');
    if (!form.gender) next.gender = t('sell.errors.gender');
    if (!/^[6-9]\d{9}$/.test(form.phone)) next.phone = t('sell.errors.phone');
    if (form.title.trim() && form.title.trim().length < 3) {
      next.title = t('sell.errors.title');
    }
    if (form.description.trim() && form.description.trim().length < 10) {
      next.description = t('sell.errors.description');
    }
    if (!form.price || Number(form.price) <= 0) next.price = t('sell.errors.price');
    if (!form.district) next.district = t('sell.errors.district');
    if (!form.taluk.trim()) next.taluk = t('sell.errors.taluk');
    if (!form.village.trim()) next.village = t('sell.errors.village');
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = t('sell.errors.pincode');
    if (!parseAgeInput(ageValue, ageUnit)) next.age = t('sell.errors.age');
    if (!isEdit && form.photos.length === 0) next.photos = t('sell.errors.photos');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onRejected = (rejected: RejectedFile) =>
    setErrors((prev) => ({
      ...prev,
      photos: t(rejected.key, rejected.params ?? {}),
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const age = parseAgeInput(ageValue, ageUnit)!;
      if (isEdit && id) {
        await listingService.update(id, {
          category: form.category,
          breed: form.breed || undefined,
          title: form.title.trim(),
          description: form.description.trim(),
          gender: form.gender || undefined,
          age,
          price: Number(form.price),
          isNegotiable: form.isNegotiable,
          phone: form.phone,
          whatsapp: (sameAsPhone ? form.phone : form.whatsapp) || undefined,
          location: {
            district: form.district,
            taluk: form.taluk || undefined,
            village: form.village || undefined,
            pincode: form.pincode,
          },
          healthInfo: form.healthInfo || undefined,
          vaccinationInfo: form.vaccinationInfo || undefined,
          categorySpecificDetails: form.details,
        });
        if (form.photos.length > 0 || form.video || removeExistingVideo) {
          await listingService.updateMedia(id, form.photos, form.video, removeExistingVideo);
        }
        navigate('/dashboard/listings');
        return;
      }
      await listingService.create({
        ...form,
        ageYears: String(age.years),
        ageMonths: String(age.months),
        whatsapp: (sameAsPhone ? form.phone : form.whatsapp) || '',
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, phone: user?.phone ?? '' });
    setAgeValue('');
    setAgeUnit('years');
    setPreviews([]);
    setVideoPreview(null);
    setExistingPhotos([]);
    setExistingVideo(null);
    setRemoveExistingVideo(false);
    setErrors({});
    setDone(false);
  };

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Seo title={t('sell.successTitle')} noIndex />
        <p className="flex justify-center text-5xl text-emerald-600"><FiCheckCircle /></p>
        <h1 className="page-title mt-4">{t('sell.successTitle')}</h1>
        <p className="mt-2 text-sm text-neutral-600">{t('sell.successText')}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard/listings" className="btn-primary">
            {t('sell.goToDashboard')}
          </Link>
          <button type="button" className="btn-outline" onClick={resetForm}>
            {t('sell.addAnother')}
          </button>
        </div>
      </div>
    );
  }

  const selectedBreed = selectedCategory?.breeds.find((b) => b.nameEn === form.breed);

  const categoryName = (categoryKey: string) =>
    t(`categories.${categoryKey}`, { defaultValue: categoryKey });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Seo
        title={isEdit ? t('sell.editTitle', { defaultValue: t('sell.title') }) : t('sell.title')}
        path={isEdit ? `/sell/${id}` : '/sell'}
        noIndex
      />

      <h1 className="page-title">
        {isEdit ? t('sell.editTitle', { defaultValue: t('sell.title') }) : t('sell.title')}
      </h1>
      <p className="mt-1 text-sm text-neutral-600">{t('sell.subtitle')}</p>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <ErrorBanner message={formError} />

        <div className="card space-y-4 p-5">
          <h2 className="section-title">{t('sell.animalDetails')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-category">{t('sell.categoryRequired')}</label>
              <select
                id="sell-category"
                className="field"
                required
                value={form.category}
                onChange={(e) => { set('category', e.target.value); set('breed', ''); }}
              >
                <option value="">{t('sell.selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {isTamil ? category.nameTa : category.nameEn}
                  </option>
                ))}
              </select>
              {errors.category && <p className="field-error">{errors.category}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-breed">{t('sell.breedRequired')}</label>
              <select
                id="sell-breed"
                className="field"
                value={form.breed}
                disabled={!selectedCategory}
                required
                onChange={(e) => set('breed', e.target.value)}
              >
                <option value="">{t('sell.selectBreed')}</option>
                {selectedCategory?.breeds.map((breed) => (
                  <option key={breed.key} value={breed.nameEn}>
                    {isTamil ? breed.nameTa : breed.nameEn}
                  </option>
                ))}
              </select>
              {errors.breed && <p className="field-error">{errors.breed}</p>}
              {selectedBreed && isTamil && (
                <p className="mt-1 text-xs text-neutral-500">{selectedBreed.nameEn}</p>
              )}
            </div>
          </div>


          {detailFields.length > 0 && (
            <div className="rounded-xl bg-neutral-50 p-4">
              <h3 className="text-sm font-bold text-neutral-900">
                {t('sell.categoryDetails', { category: categoryName(form.category) })}
              </h3>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {detailFields.map((field) => (
                  <div key={field.name}>
                    <label className="field-label" htmlFor={`sell-detail-${field.name}`}>
                      {getDetailFieldLabel(field.name, i18n.language)}
                    </label>
                    {field.type === 'boolean' ? (
                      <select
                        id={`sell-detail-${field.name}`}
                        className="field"
                        value={form.details[field.name] ?? ''}
                        onChange={(e) => setDetail(field.name, e.target.value)}
                      >
                        <option value="">—</option>
                        <option value="true">{t('common.yes')}</option>
                        <option value="false">{t('common.no')}</option>
                      </select>
                    ) : (
                      <input
                        id={`sell-detail-${field.name}`}
                        className="field"
                        type={field.type === 'number' ? 'number' : 'text'}
                        min={field.type === 'number' ? 0 : undefined}
                        value={form.details[field.name] ?? ''}
                        onChange={(e) => setDetail(field.name, e.target.value)}
                        placeholder={isTamil ? field.placeholderTa : field.placeholderEn}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="field-label" htmlFor="sell-title">{t('sell.listingTitle')}</label>
            <input
              id="sell-title"
              className="field"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder={t('sell.listingTitlePlaceholder')}
              maxLength={80}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div>
            <label className="field-label" htmlFor="sell-description">{t('sell.description')}</label>
            <textarea
              id="sell-description"
              className="field min-h-28"
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={t('sell.descriptionPlaceholder')}
              maxLength={800}
            />
            {errors.description && <p className="field-error">{errors.description}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-gender">{t('sell.genderRequired')}</label>
              <select
                id="sell-gender"
                className="field"
                value={form.gender}
                required
                onChange={(e) => set('gender', e.target.value as Gender | '')}
              >
                <option value="">{t('sell.selectGender')}</option>
                {GENDERS.map((gender) => (
                  <option key={gender} value={gender}>
                    {t(`listing.${gender.toLowerCase()}`)}
                  </option>
                ))}
              </select>
              {errors.gender && <p className="field-error">{errors.gender}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-age-value">{t('sell.ageRequired')}</label>
              <div className="flex gap-2">
                <input
                  id="sell-age-value"
                  className="field min-w-0 flex-1"
                  type="text"
                  inputMode={ageUnit === 'years' ? 'decimal' : 'numeric'}
                  value={ageValue}
                  required
                  aria-describedby="sell-age-help"
                  placeholder={t(ageUnit === 'years' ? 'sell.ageYearsPlaceholder' : 'sell.ageMonthsPlaceholder')}
                  onChange={(e) => setAgeValue(e.target.value)}
                />
                <select
                  className="field w-32 shrink-0"
                  value={ageUnit}
                  aria-label={t('sell.ageUnit')}
                  onChange={(e) => {
                    const nextUnit = e.target.value as AgeUnit;
                    const parsedAge = parseAgeInput(ageValue, ageUnit);
                    if (parsedAge) {
                      setAgeValue(
                        nextUnit === 'months'
                          ? String(parsedAge.years * 12 + parsedAge.months)
                          : `${parsedAge.years}${parsedAge.months > 0 ? `.${parsedAge.months}` : ''}`
                      );
                    }
                    setAgeUnit(nextUnit);
                  }}
                >
                  <option value="years">{t('sell.years')}</option>
                  <option value="months">{t('sell.months')}</option>
                </select>
              </div>
              <p id="sell-age-help" className="mt-1 text-xs text-neutral-500">
                {t('sell.ageHelp')}
              </p>
              {(() => {
                const parsedAge = parseAgeInput(ageValue, ageUnit);
                const preview = parsedAge ? formatAge(parsedAge, t) : null;
                return preview ? (
                  <p className="mt-1 text-xs font-medium text-brand-700">
                    {t('sell.agePreview', { age: preview })}
                  </p>
                ) : null;
              })()}
              {errors.age && <p className="field-error">{errors.age}</p>}
            </div>
          </div>


          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-price">{t('listing.price')}</label>
              <input
                id="sell-price"
                className="field"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="₹"
              />
              {errors.price && <p className="field-error">{errors.price}</p>}
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600"
                checked={form.isNegotiable}
                onChange={(e) => set('isNegotiable', e.target.checked)}
              />
              {t('sell.isNegotiable')}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-health">{t('sell.healthInfo')}</label>
              <input
                id="sell-health"
                className="field"
                value={form.healthInfo}
                onChange={(e) => set('healthInfo', e.target.value)}
                placeholder={t('sell.healthInfoPlaceholder')}
                maxLength={500}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="sell-vaccination">{t('sell.vaccinationInfo')}</label>
              <input
                id="sell-vaccination"
                className="field"
                value={form.vaccinationInfo}
                onChange={(e) => set('vaccinationInfo', e.target.value)}
                placeholder={t('sell.vaccinationInfoPlaceholder')}
                maxLength={500}
              />
            </div>
          </div>
        </div>


        <div className="card space-y-4 p-5">
          <h2 className="section-title">{t('sell.locationAndContact')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-district">{t('sell.district')}</label>
              <select
                id="sell-district"
                className="field"
                value={form.district}
                required
                onChange={(e) => set('district', e.target.value)}
              >
                <option value="">{t('sell.selectDistrict')}</option>
                {TAMIL_NADU_DISTRICTS.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="field-error">{errors.district}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-taluk">{t('sell.talukRequired')}</label>
              <input
                id="sell-taluk"
                className="field"
                value={form.taluk}
                required
                onChange={(e) => set('taluk', e.target.value)}
                maxLength={60}
              />
              {errors.taluk && <p className="field-error">{errors.taluk}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-village">{t('sell.villageRequired')}</label>
              <input
                id="sell-village"
                className="field"
                value={form.village}
                required
                onChange={(e) => set('village', e.target.value)}
                maxLength={80}
              />
              {errors.village && <p className="field-error">{errors.village}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-pincode">{t('sell.pincodeRequired')}</label>
              <input
                id="sell-pincode"
                className="field"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.pincode}
                required
                onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              {errors.pincode && <p className="field-error">{errors.pincode}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="sell-phone">{t('sell.phoneRequired')}</label>
              <input
                id="sell-phone"
                className="field"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                required
                onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
              {errors.phone && <p className="field-error">{errors.phone}</p>}
            </div>
            <div>
              <label className="field-label" htmlFor="sell-whatsapp">{t('sell.whatsapp')}</label>
              <input
                id="sell-whatsapp"
                className="field"
                inputMode="numeric"
                maxLength={10}
                value={sameAsPhone ? form.phone : form.whatsapp}
                disabled={sameAsPhone}
                onChange={(e) => set('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder={t('sell.sameAsPhone')}
              />
              <label className="mt-2 flex items-center gap-2 text-xs font-medium text-neutral-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-600"
                  checked={sameAsPhone}
                  onChange={(e) => {
                    setSameAsPhone(e.target.checked);
                    if (e.target.checked) set('whatsapp', '');
                  }}
                />
                {t('sell.sameAsPhone')}
              </label>
            </div>
          </div>
          <p className="rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            <span className="inline-flex items-start gap-2"><span className="mt-0.5 shrink-0"><FiPhoneCall /></span>{t('sell.contactNote')}</span>
          </p>
        </div>

        <div className="card space-y-4 p-5">
          <h2 className="section-title">{t('sell.photos')}</h2>
          <p className="text-xs text-neutral-500">{t('sell.photosHint')}</p>
          <p className="text-xs text-neutral-500">{t('sell.videoNote')}</p>
          {isEdit && existingPhotos.length > 0 && (
            <div>
              <p className="field-label">{t('sell.currentPhotos')}</p>
              <p className="mb-2 text-xs text-neutral-500">{t('sell.mediaEditHint')}</p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {existingPhotos.map((src, index) => (
                  <img key={`${src}-${index}`} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
                ))}
              </div>
            </div>
          )}
          {isEdit && existingVideo && !removeExistingVideo && (
            <div>
              <p className="field-label">{t('sell.currentVideo')}</p>
              <div className="flex items-center gap-3">
                <video src={existingVideo} controls className="h-24 w-36 rounded-xl border border-neutral-200 bg-black object-cover" />
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setRemoveExistingVideo(true)}>
                  {t('sell.removeCurrentVideo')}
                </button>
              </div>
            </div>
          )}
          {isEdit && removeExistingVideo && (
            <p className="text-xs text-red-600">{t('sell.videoWillBeRemoved')}</p>
          )}
          {isEdit && previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {previews.map((src, index) => (
                <img key={`${src}-${index}`} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          )}
          <PhotoUploader
            photos={form.photos}
            previews={previews}
            video={form.video}
            videoPreview={videoPreview}
            onPhotosChange={(photos) => set('photos', photos)}
            onVideoChange={(video) => set('video', video)}
            onReject={onRejected}
          />
          {errors.photos && <p className="field-error">{errors.photos}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="btn-primary flex-1 py-3 text-base sm:flex-none sm:px-10"
            disabled={submitting}
          >
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {isEdit ? t('common.save') : t('sell.submit')}
          </button>
          {submitting && <SuccessBanner message={t('sell.submitting')} />}
        </div>
      </form>
    </div>
  );
}
