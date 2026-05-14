import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate, getStatusBadgeClass } from '../../utils/format';

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchDeposits(); }, [page, status]);

  async function fetchDeposits() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const { data } = await adminApi.get(`/api/admin/deposits?${params}`);
      setDeposits(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposits</h1>
        <select className="input-field w-auto" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
          <option value="failed">Failed</option>
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
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Reference</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Gateway</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">#{d.id}</td>
                    <td className="py-3 px-2 font-medium">{d.username}</td>
                    <td className="py-3 px-2 font-mono text-xs">{d.reference}</td>
                    <td className="py-3 px-2">{d.gateway_name}</td>
                    <td className="py-3 px-2 font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="py-3 px-2"><span className={getStatusBadgeClass(d.status)}>{d.status}</span></td>
                    <td className="py-3 px-2 text-xs text-gray-500">{formatDate(d.created_at)}</td>
                  </tr>
                ))}
                {deposits.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-500">No data</td></tr>
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
