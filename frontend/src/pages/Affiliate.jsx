import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiClipboard } from 'react-icons/hi';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/format';

export default function Affiliate() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchAffiliate();
  }, []);

  async function fetchAffiliate() {
    try {
      const { data: res } = await api.get('/api/user/affiliate');
      setData(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  function copyReferralLink() {
    const link = `${window.location.origin}/register?ref=${data?.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success(t('common.copy_success'));
  }

  if (loading) return <Layout showSidebar><LoadingSpinner /></Layout>;

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('affiliate.title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <span className="text-sm text-gray-500">{t('affiliate.referral_code')}</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-bold text-primary-600 font-mono">{data?.referral_code}</span>
            <button onClick={copyReferralLink} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <HiClipboard size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
        <div className="stat-card">
          <span className="text-sm text-gray-500">{t('affiliate.total_referrals')}</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data?.affiliate?.total_referrals || 0}</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-gray-500">{t('affiliate.total_commission')}</span>
          <span className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(data?.affiliate?.total_commission || 0)}</span>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('affiliate.commission_rate')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500">{t('affiliate.deposit_rate')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.affiliate?.commission_rate_deposit || 5}%</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500">{t('affiliate.order_rate')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.affiliate?.commission_rate_order || 3}%</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('affiliate.history')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">User</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Type</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Amount</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Commission</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {(data?.commissions || []).map((c) => (
                <tr key={c.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-3 px-2 text-gray-900 dark:text-gray-200">{c.referred_username}</td>
                  <td className="py-3 px-2"><span className="badge-info">{c.type}</span></td>
                  <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{formatCurrency(c.amount)}</td>
                  <td className="py-3 px-2 text-green-600 font-semibold">{formatCurrency(c.commission_amount)}</td>
                  <td className="py-3 px-2 text-gray-500 text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))}
              {(!data?.commissions || data.commissions.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">{t('common.no_data')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
