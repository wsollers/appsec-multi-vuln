import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../lib/apiClient';
import { useAuth } from '../lib/auth';
import type { Order, Paginated } from '../types/api';

/**
 * Orders screen. Lists orders (the server scopes the list to the caller's own
 * orders for sales users) and supports deletion. The server enforces
 * object-level authorization regardless of what the UI shows (threat I1).
 */
export function OrdersPage() {
  const { canWrite } = useAuth();
  const writable = canWrite('orders');
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.list<Order>('orders', { page: String(page), pageSize: '25' }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load orders');
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm(`Delete order ${id}?`)) return;
    try {
      await api.remove('orders', id);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Orders</h1>
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {['Order', 'Customer', 'Employee', 'Order date', 'Freight', 'Ship to'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium text-slate-500">
                  {h}
                </th>
              ))}
              {writable && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.items.map((o) => (
              <tr key={o.orderId} className="hover:bg-slate-50">
                <td className="px-4 py-2">{o.orderId}</td>
                <td className="px-4 py-2">{o.customerId ?? '—'}</td>
                <td className="px-4 py-2">{o.employeeId ?? '—'}</td>
                <td className="px-4 py-2">{o.orderDate ?? '—'}</td>
                <td className="px-4 py-2">${o.freight.toFixed(2)}</td>
                <td className="px-4 py-2">
                  {o.shipCity ?? '—'}, {o.shipCountry ?? '—'}
                </td>
                {writable && (
                  <td className="px-4 py-2 text-right">
                    <button className="text-red-600 hover:underline" onClick={() => void remove(o.orderId)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={7}>
                  No orders visible to your account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {data && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>{data.total} order(s)</span>
          <div className="flex gap-2">
            <button
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
              disabled={page * data.pageSize >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
