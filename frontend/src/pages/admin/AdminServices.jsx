import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import { formatCurrency } from '../../utils/format';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [countries, setCountries] = useState([]);
  const [otpServices, setOtpServices] = useState([]);
  const [providers, setProviders] = useState([]);
  const [form, setForm] = useState({
    country_id: '', service_id: '', operator_id: '', provider_id: '',
    cost_price: '', markup_percent: '', sell_price: '', is_active: true,
  });

  useEffect(() => { fetchServices(); fetchRefData(); }, [page]);

  async function fetchServices() {
    setLoading(true);
    try {
      const { data } = await adminApi.get(`/api/admin/services?page=${page}&limit=50`);
      setServices(data.data);
      setMeta(data.meta);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function fetchRefData() {
    try {
      const [c, s, p] = await Promise.all([
        adminApi.get('/api/admin/countries'),
        adminApi.get('/api/admin/otp-services'),
        adminApi.get('/api/admin/providers'),
      ]);
      setCountries(c.data.data);
      setOtpServices(s.data.data);
      setProviders(p.data.data);
    } catch { /* ignore */ }
  }

  function openCreate() {
    setForm({ country_id: '', service_id: '', operator_id: '', provider_id: '', cost_price: '', markup_percent: '', sell_price: '', is_active: true });
    setModal('create');
  }

  function openEdit(s) {
    setForm({
      country_id: s.country_id, service_id: s.service_id, operator_id: s.operator_id || '',
      provider_id: s.provider_id, cost_price: s.cost_price, markup_percent: s.markup_percent,
      sell_price: s.sell_price, is_active: !!s.is_active,
    });
    setModal(s.id);
  }

  async function handleSave() {
    const payload = {
      country_id: parseInt(form.country_id, 10),
      service_id: parseInt(form.service_id, 10),
      operator_id: form.operator_id ? parseInt(form.operator_id, 10) : null,
      provider_id: parseInt(form.provider_id, 10),
      cost_price: parseFloat(form.cost_price),
      markup_percent: parseFloat(form.markup_percent),
      sell_price: parseFloat(form.sell_price),
      is_active: form.is_active,
    };
    try {
      if (modal === 'create') {
        await adminApi.post('/api/admin/services', payload);
        toast.success('Service created');
      } else {
        await adminApi.put(`/api/admin/services/${modal}`, payload);
        toast.success('Service updated');
      }
      setModal(null);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service?')) return;
    try {
      await adminApi.delete(`/api/admin/services/${id}`);
      toast.success('Deleted');
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services / Pricing</h1>
        <button onClick={openCreate} className="btn-primary text-sm">+ Add Service</button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Country</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Service</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Operator</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Provider</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Cost</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Markup</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Sell</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Active</th>
                  <th className="text-left py-3 px-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2">{s.country_name}</td>
                    <td className="py-3 px-2 font-medium">{s.service_name}</td>
                    <td className="py-3 px-2">{s.operator_name || '-'}</td>
                    <td className="py-3 px-2">{s.provider_name}</td>
                    <td className="py-3 px-2">{formatCurrency(s.cost_price)}</td>
                    <td className="py-3 px-2">{s.markup_percent}%</td>
                    <td className="py-3 px-2 font-semibold text-primary-600">{formatCurrency(s.sell_price)}</td>
                    <td className="py-3 px-2">
                      <span className={s.is_active ? 'badge-success' : 'badge-danger'}>{s.is_active ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="btn-secondary text-xs py-1 px-2">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="btn-danger text-xs py-1 px-2">Del</button>
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

      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {modal === 'create' ? 'Add Service' : 'Edit Service'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <select className="input-field" value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value })}>
                <option value="">Country</option>
                {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input-field" value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
                <option value="">Service</option>
                {otpServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="input-field" value={form.provider_id} onChange={(e) => setForm({ ...form, provider_id: e.target.value })}>
                <option value="">Provider</option>
                {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" className="input-field" placeholder="Cost Price" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              <input type="number" className="input-field" placeholder="Markup %" value={form.markup_percent} onChange={(e) => setForm({ ...form, markup_percent: e.target.value })} />
              <input type="number" className="input-field" placeholder="Sell Price" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
              <label className="flex items-center gap-2 col-span-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="btn-primary flex-1">Save</button>
              <button onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
