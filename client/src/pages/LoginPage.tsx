import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Seo from '../components/Seo';
import { ErrorBanner, LoadingState, Spinner } from '../components/Feedback';
import LanguageSwitcher from '../components/LanguageSwitcher';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { isValidOtp, isValidPhone, maskPhone } from '../utils/format';

/** Single-page OTP flow: name (optional) + phone, then inline OTP with resend timer. */
export default function LoginPage({ adminMode = false }: { adminMode?: boolean }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const { isAuthenticated, isLoading, login, logout, user } = useAuth();

  const defaultTarget = adminMode ? '/admin' : '/listings';
  const redirectFrom = location.state?.from ?? defaultTarget;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (!otpSent || secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpSent, secondsLeft]);

  if (isAuthenticated) {
    const dest = redirectFrom?.startsWith('/admin') || user?.role === 'ADMIN' || adminMode ? '/admin' : '/listings';
    return <Navigate to={dest} replace />;
  }

  const digits = phone.replace(/\D/g, '').slice(-10);

  const sendOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setError(null);
    if (!isValidPhone(digits)) {
      setError(t('static.invalidPhone'));
      return;
    }
    setSubmitting(true);
    try {
      logout();
      const res = await authService.requestOtp(digits);
      setOtpSent(true);
      setOtp('');
      setSecondsLeft(30);
      const match = /\b(\d{6})\b/.exec(res.message ?? '');
      if (match) setDevOtp(match[1]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!isValidOtp(otp)) {
      setError(t('static.otpInvalid'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await authService.verifyOtp({ phone: digits, otp, name: name.trim() || undefined });

      if (adminMode && res.user.role !== 'ADMIN') {
        setError('This account is not an admin account. Use the regular login page.');
        return;
      }

      login(res.token, res.user);
      const destination = redirectFrom?.startsWith('/admin') || res.user.role === 'ADMIN' ? '/admin' : '/listings';
      navigate(destination, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      setError(message);
      const match = /\b(\d{6})\b/.exec(message);
      if (match) setDevOtp(match[1]);
    } finally {
      setSubmitting(false);
    }
  };

  const changeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setError(null);
    setDevOtp(null);
    setSecondsLeft(0);
  };

  const submit = (event: React.FormEvent) => {
    if (otpSent) {
      return verify(event);
    }
    return sendOtp(event);
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <Seo title={t('auth.title')} noIndex />

      <div className="card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/listings" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white">
              🐾
            </span>
            <span className="text-base font-extrabold text-brand-700">{t('brand.name')}</span>
          </Link>
          <LanguageSwitcher compact />
        </div>

        <h1 className="text-2xl font-bold text-neutral-900">{t('auth.title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">{t('auth.subtitle')}</p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <ErrorBanner message={error} />

          <div>
            <label className="field-label" htmlFor="name">
              {t('auth.nameOnLogin', { defaultValue: t('auth.name') })}
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('auth.namePlaceholder')}
              autoComplete="name"
              className="field"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="phone">
              {t('auth.phone')}
            </label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-neutral-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
              <span className="grid place-items-center border-r border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-600">
                +91
              </span>
              <input
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={digits}
                disabled={otpSent}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('auth.phonePlaceholder')}
                className="w-full border-0 px-3.5 py-2.5 text-sm focus:outline-none disabled:bg-neutral-100 disabled:text-neutral-500"
              />
            </div>
          </div>

          {otpSent && (
            <>
              <p className="text-sm text-neutral-600">{t('auth.otpSentTo', { phone: maskPhone(digits) })}</p>
              <div>
                <label className="field-label" htmlFor="otp">{t('auth.otp')}</label>
                <input
                  id="otp"
                  autoFocus
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.otpPlaceholder')}
                  className="field text-center text-2xl font-bold tracking-[0.4em]"
                />
              </div>
              {devOtp && (
                <p className="rounded-xl bg-accent-50 px-3 py-2 text-xs text-accent-800">
                  {t('auth.devHint')} <span className="font-mono font-bold">{devOtp}</span>
                </p>
              )}
            </>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {t(otpSent ? 'auth.verifyOtp' : 'auth.sendOtp')}
          </button>

          {otpSent && (
            <div className="flex items-center justify-between text-xs">
              {secondsLeft > 0 ? (
                <span className="text-neutral-500">{t('auth.resendOtp')} ({secondsLeft}s)</span>
              ) : (
                <button type="button" className="font-semibold text-brand-700" onClick={() => void sendOtp()}>
                  {t('auth.resendOtp')}
                </button>
              )}
              <button type="button" className="font-semibold text-neutral-600 hover:underline" onClick={changeNumber}>
                {t('auth.changeNumber')}
              </button>
            </div>
          )}
        </form>

        <p className="mt-5 rounded-xl bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
          {t('auth.devHint')}
        </p>
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">
        <Link to="/safety" className="font-semibold hover:underline">
          {t('footer.safety')}
        </Link>
      </p>
    </div>
  );
}
