import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate } from '../utils/format';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useLanguage();

  useEffect(() => {
    fetchTransactions();
  }, [page, type]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (type) params.append('type', type);
      const { data } = await api.get(`/api/user/transactions?${params}`);
      setTransactions(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <Layout showSidebar>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transaction.title')}</h1>
        <select className="input-field w-auto" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="deposit">{t('transaction.deposit')}</option>
          <option value="order">{t('transaction.order')}</option>
          <option value="refund">{t('transaction.refund')}</option>
          <option value="manual_add">{t('transaction.manual_add')}</option>
          <option value="manual_deduct">{t('transaction.manual_deduct')}</option>
          <option value="affiliate_commission">{t('transaction.affiliate_commission')}</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('transaction.type')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('transaction.amount')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('transaction.balance')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('transaction.description')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('transaction.time')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">
                      <span className="badge-info">{tx.type}</span>
                    </td>
                    <td className={`py-3 px-2 font-semibold ${parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(tx.balance_after)}</td>
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-200">{tx.description}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{formatDate(tx.created_at)}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500">{t('common.no_data')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}
    </Layout>
  );
}
