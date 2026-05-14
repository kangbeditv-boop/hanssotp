import { useState, useEffect } from 'react';
import { HiUsers, HiCurrencyDollar, HiClipboardList, HiTrendingUp } from 'react-icons/hi';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const { data: res } = await adminApi.get('/api/admin/dashboard');
      setData(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  if (loading) return <AdminLayout><LoadingSpinner /></AdminLayout>;

  const stats = [
    { label: 'Total Users', value: data?.total_users || 0, icon: HiUsers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Deposit', value: formatCurrency(data?.total_deposit || 0), icon: HiCurrencyDollar, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: data?.total_orders || 0, icon: HiClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Profit', value: formatCurrency(data?.profit || 0), icon: HiTrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{stat.label}</span>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="stat-card">
          <span className="text-sm text-gray-500">Today Deposits</span>
          <span className="text-xl font-bold text-green-600">{formatCurrency(data?.today_deposit || 0)}</span>
        </div>
        <div className="stat-card">
          <span className="text-sm text-gray-500">Today Orders</span>
          <span className="text-xl font-bold text-purple-600">{data?.today_orders || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Deposits</h2>
          <div className="space-y-3">
            {(data?.recent_deposits || []).map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{d.username}</p>
                  <p className="text-xs text-gray-500">{d.reference}</p>
                </div>
                <div className="text-right">
                  <span className={getStatusBadgeClass(d.status)}>{d.status}</span>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(d.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {(data?.recent_orders || []).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{o.username}</p>
                  <p className="text-xs text-gray-500">{o.service_name} - {o.phone_number || '-'}</p>
                </div>
                <div className="text-right">
                  <span className={getStatusBadgeClass(o.status)}>{o.status}</span>
                  <p className="text-sm text-gray-500 mt-1">{formatCurrency(o.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
