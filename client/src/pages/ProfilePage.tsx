import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiHeart, FiLock, FiPlus, FiShield, FiUser } from 'react-icons/fi';
import DashboardLayout from '../layouts/DashboardLayout';
import type { NavItem } from '../layouts/DashboardLayout';
import Seo from '../components/Seo';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { TAMIL_NADU_DISTRICTS } from '../utils/constants';
import { maskPhone } from '../utils/format';

export const PROFILE_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'seller.dashboard', icon: <FiBarChart2 />, end: true },
  { to: '/favourites', labelKey: 'nav.favourites', icon: <FiHeart /> },
  { to: '/profile', labelKey: 'nav.profile', icon: <FiUser /> },
];

/** Editable name + district/taluk/village. Phone is identity, never editable. */
export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [district, setDistrict] = useState(user?.location?.district ?? '');
  const [taluk, setTaluk] = useState(user?.location?.taluk ?? '');
  const [village, setVillage] = useState(user?.location?.village ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Re-sync when the session finishes restoring after a page reload.
  useEffect(() => {
    setName(user?.name ?? '');
    setDistrict(user?.location?.district ?? '');
    setTaluk(user?.location?.taluk ?? '');
    setVillage(user?.location?.village ?? '');
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await authService.updateProfile({
        name: name.trim() || undefined,
        location: district
          ? { district, taluk: taluk.trim() || undefined, village: village.trim() || undefined }
          : undefined,
      });
      updateUser(updated);
      setMessage({ kind: 'ok', text: t('profile.saved') });
    } catch (err) {
      setMessage({ kind: 'err', text: err instanceof Error ? err.message : t('common.error') });
    } finally {
      setSaving(false);
    }
  };


  return (
    <DashboardLayout items={PROFILE_NAV_ITEMS} title={t('profile.title')}>
      <Seo title={t('profile.title')} path="/profile" noIndex />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-bold text-brand-700">
              {(user?.name || user?.phone || 'U').trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-neutral-900">
                {user?.name || t('listing.sellerInfo')}
              </p>
              <p className="text-sm text-neutral-600">+91 {maskPhone(user?.phone ?? '')}</p>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            <span className="inline-flex items-start gap-2"><FiLock />{t('profile.phoneLocked')}</span>
          </p>
          <p className="mt-3 rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
            <span className="inline-flex items-start gap-2"><FiShield />{t('profile.securityText')}</span>
          </p>
          <Link to="/sell" className="btn-primary mt-4 w-full">
            <span className="inline-flex items-center justify-center gap-1.5"><FiPlus />{t('seller.addListing')}</span>
          </Link>
        </div>

        <form onSubmit={save} className="card space-y-4 p-5">
          {message && (
            <p
              role="status"
              className={
                message.kind === 'ok'
                  ? 'rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800'
                  : 'rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700'
              }
            >
              {message.text}
            </p>
          )}

          <div>
            <label className="field-label" htmlFor="profile-name">
              {t('profile.name')}
            </label>
            <input
              id="profile-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              maxLength={60}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="profile-district">
                {t('profile.district')}
              </label>
              <select
                id="profile-district"
                className="field"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">{t('search.allDistricts')}</option>
                {TAMIL_NADU_DISTRICTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="profile-taluk">
                {t('profile.taluk')}
              </label>
              <input
                id="profile-taluk"
                className="field"
                value={taluk}
                onChange={(e) => setTaluk(e.target.value)}
                maxLength={60}
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="profile-village">
              {t('profile.village')}
            </label>
            <input
              id="profile-village"
              className="field"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              maxLength={80}
            />
          </div>

          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
            {saving ? t('common.loading') : t('profile.save')}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
