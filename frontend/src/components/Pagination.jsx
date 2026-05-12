import { useLanguage } from '../contexts/LanguageContext';

export default function Pagination({ meta, onPageChange }) {
  const { t } = useLanguage();
  if (!meta || meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {meta.total} items &middot; Page {meta.page} / {meta.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          className="btn-secondary text-sm py-1.5 px-3"
          disabled={!meta.hasPrev}
          onClick={() => onPageChange(meta.page - 1)}
        >
          {t('common.prev')}
        </button>
        <button
          className="btn-secondary text-sm py-1.5 px-3"
          disabled={!meta.hasNext}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
