import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/format';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchOrders(); }, [page, status]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const { data } = await adminApi.get(`/api/admin/orders?${params}`);
      setOrders(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleRefund(orderId) {
    const reason = prompt('Refund reason:');
    if (!reason) return;
    try {
      await adminApi.post('/api/admin/refund', { order_id: orderId, reason });
      toast.success('Refund berhasil');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="waiting_otp">Waiting OTP</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">User</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Service</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Phone</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">OTP</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Price</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">#{o.id}</td>
                    <td className="py-3 px-2 font-medium">{o.username}</td>
                    <td className="py-3 px-2">{o.service_name} ({o.country_name})</td>
                    <td className="py-3 px-2 font-mono">{o.phone_number || '-'}</td>
                    <td className="py-3 px-2 font-mono font-bold text-green-600">{o.otp_code || '-'}</td>
                    <td className="py-3 px-2"><span className={getStatusBadgeClass(o.status)}>{o.status}</span></td>
                    <td className="py-3 px-2">{formatCurrency(o.price)}</td>
                    <td className="py-3 px-2 text-xs text-gray-500">{formatDate(o.created_at)}</td>
                    <td className="py-3 px-2">
                      {!['refunded', 'cancelled'].includes(o.status) && (
                        <button onClick={() => handleRefund(o.id)} className="btn-danger text-xs py-1 px-2">Refund</button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={9} className="py-8 text-center text-gray-500">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}
    </AdminLayout>
  );
}
