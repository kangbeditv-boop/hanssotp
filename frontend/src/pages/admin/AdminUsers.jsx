import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { formatCurrency, formatDate } from '../../utils/format';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [balanceModal, setBalanceModal] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ amount: '', type: 'add', reason: '' });

  useEffect(() => { fetchUsers(); }, [page, search]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      const { data } = await adminApi.get(`/api/admin/users?${params}`);
      setUsers(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleBan(userId, ban) {
    const reason = ban ? prompt('Ban reason:') : null;
    if (ban && !reason) return;
    try {
      await adminApi.patch(`/api/admin/users/${userId}/ban`, { is_banned: ban, reason });
      toast.success(ban ? 'User banned' : 'User unbanned');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  async function handleUpdateBalance() {
    if (!balanceModal) return;
    try {
      await adminApi.patch(`/api/admin/users/${balanceModal}/balance`, {
        amount: parseFloat(balanceForm.amount),
        type: balanceForm.type,
        reason: balanceForm.reason,
      });
      toast.success('Balance updated');
      setBalanceModal(null);
      setBalanceForm({ amount: '', type: 'add', reason: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <input
          type="text" placeholder="Search users..." className="input-field w-auto"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">ID</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Username</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Email</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Balance</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Orders</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">{u.id}</td>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{u.username}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3 px-2 font-semibold text-green-600">{formatCurrency(u.balance)}</td>
                    <td className="py-3 px-2 text-gray-600">{u.total_order}</td>
                    <td className="py-3 px-2">
                      <span className={u.is_banned ? 'badge-danger' : 'badge-success'}>{u.is_banned ? 'Banned' : 'Active'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button onClick={() => setBalanceModal(u.id)} className="btn-secondary text-xs py-1 px-2">Balance</button>
                        <button onClick={() => handleBan(u.id, !u.is_banned)} className={`text-xs py-1 px-2 rounded ${u.is_banned ? 'btn-success' : 'btn-danger'}`}>
                          {u.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </>
      )}

      {balanceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Update Balance</h3>
            <div className="space-y-3">
              <select className="input-field" value={balanceForm.type} onChange={(e) => setBalanceForm({ ...balanceForm, type: e.target.value })}>
                <option value="add">Add Balance</option>
                <option value="deduct">Deduct Balance</option>
              </select>
              <input type="number" className="input-field" placeholder="Amount" value={balanceForm.amount} onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })} />
              <input type="text" className="input-field" placeholder="Reason" value={balanceForm.reason} onChange={(e) => setBalanceForm({ ...balanceForm, reason: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleUpdateBalance} className="btn-primary flex-1">Save</button>
              <button onClick={() => setBalanceModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
