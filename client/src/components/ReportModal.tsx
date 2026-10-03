import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { reportService } from '../services';
import { ErrorBanner, Spinner } from './Feedback';
import type { ReportReason } from '../types';

const REASONS: ReportReason[] = [
  'FAKE',
  'WRONG_INFO',
  'SOLD',
  'SUSPICIOUS',
  'INAPPROPRIATE',
  'DUPLICATE',
  'OTHER',
];

interface ReportModalProps {
  open: boolean;
  listingId: string;
  onClose: () => void;
  onDone: () => void;
}

export default function ReportModal({ open, listingId, onClose, onDone }: ReportModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason>('FAKE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await reportService.create({
        listingId,
        reason,
        description: description.trim() || undefined,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('report.title')}
      description={t('report.subtitle')}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={submitting}>
            {t('report.cancel')}
          </button>
          <button type="button" className="btn-danger" onClick={submit} disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {t('report.submit')}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ErrorBanner message={error} />

        <div>
          <span className="field-label">{t('report.reason')}</span>
          <div className="space-y-1.5">
            {REASONS.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="h-4 w-4 accent-brand-600"
                />
                <span className="text-neutral-800">{t(`report.reasons.${value}`)}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="report-description">
            {t('report.description')}
          </label>
          <textarea
            id="report-description"
            rows={3}
            className="field"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('report.descriptionPlaceholder')}
          />
        </div>
      </div>
    </Modal>
  );
}
