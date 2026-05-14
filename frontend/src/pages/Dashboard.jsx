import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCurrencyDollar, HiTrendingUp, HiClipboardList, HiPhone } from 'react-icons/hi';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/format';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const token = localStorage.getItem('token');
  useSocket(token);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data: res } = await api.get('/api/user/dashboard');
      setData(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Layout showSidebar><LoadingSpinner /></Layout>;

  const stats = [
    { label: t('dashboard.balance'), value: formatCurrency(data?.balance || 0), icon: HiCurrencyDollar, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: t('dashboard.total_deposit'), value: formatCurrency(data?.total_deposit || 0), icon: HiTrendingUp, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: t('dashboard.total_order'), value: data?.total_order || 0, icon: HiClipboardList, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: t('dashboard.active_orders'), value: data?.active_orders || 0, icon: HiPhone, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  return (
    <Layout showSidebar>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recent_orders')}</h2>
            <Link to="/orders" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recent_orders || []).slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{order.service_name}</p>
                  <p className="text-xs text-gray-500">{order.phone_number || '-'}</p>
                </div>
                <div className="text-right">
                  <span className={getStatusBadgeClass(order.status)}>{order.status}</span>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(order.price)}</p>
                </div>
              </div>
            ))}
            {(!data?.recent_orders || data.recent_orders.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">{t('common.no_data')}</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recent_transactions')}</h2>
            <Link to="/transactions" className="text-sm text-primary-600 hover:text-primary-700">View all</Link>
          </div>
          <div className="space-y-3">
            {(data?.recent_transactions || []).slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                </div>
                <span className={`text-sm font-semibold ${parseFloat(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
            {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">{t('common.no_data')}</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
