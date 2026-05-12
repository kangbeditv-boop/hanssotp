import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../utils/format';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useLanguage();

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const { data } = await api.get(`/api/user/orders?${params}`);
      setOrders(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <Layout showSidebar>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('order.title')}</h1>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">{t('order.pending')}</option>
          <option value="waiting_otp">{t('order.waiting_otp')}</option>
          <option value="received">{t('order.received')}</option>
          <option value="cancelled">{t('order.cancelled')}</option>
          <option value="expired">{t('order.expired')}</option>
          <option value="refunded">{t('order.refunded')}</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.id')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.service')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.provider')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.phone')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.otp')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.status')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.price')}</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">{t('order.time')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-200">#{order.id}</td>
                    <td className="py-3 px-2">
                      <div>
                        <p className="text-gray-900 dark:text-gray-200">{order.service_name}</p>
                        <p className="text-xs text-gray-500">{order.country_name} {order.flag_emoji}</p>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{order.provider_name}</td>
                    <td className="py-3 px-2 font-mono text-gray-900 dark:text-gray-200">{order.phone_number || '-'}</td>
                    <td className="py-3 px-2 font-mono font-bold text-green-600">{order.otp_code || '-'}</td>
                    <td className="py-3 px-2"><span className={getStatusBadgeClass(order.status)}>{order.status}</span></td>
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-200">{formatCurrency(order.price)}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{formatDate(order.created_at)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500">{t('common.no_data')}</td></tr>
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
