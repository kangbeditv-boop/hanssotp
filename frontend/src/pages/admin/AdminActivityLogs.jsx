import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { formatDate } from '../../utils/format';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => { fetchLogs(); }, [page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const { data } = await adminApi.get(`/api/admin/activity-logs?page=${page}&limit=50`);
      setLogs(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Activity Logs</h1>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Time</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Actor</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Action</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Resource</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">IP</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2 text-xs text-gray-500">{formatDate(log.created_at)}</td>
                    <td className="py-3 px-2">
                      <span className="badge-info">{log.actor_type}</span>
                      <span className="text-xs text-gray-500 ml-1">#{log.actor_id}</span>
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-white">{log.action}</td>
                    <td className="py-3 px-2 text-gray-600">{log.resource_type} #{log.resource_id}</td>
                    <td className="py-3 px-2 text-xs text-gray-500">{log.ip_address}</td>
                    <td className="py-3 px-2 text-xs text-gray-500 max-w-xs truncate">
                      {log.details ? JSON.stringify(JSON.parse(log.details)) : '-'}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No data</td></tr>
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
