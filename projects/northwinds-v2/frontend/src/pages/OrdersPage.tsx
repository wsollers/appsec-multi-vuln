import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../lib/apiClient';
import { useAuth } from '../lib/auth';
import type { Order, OrderDetail, Paginated } from '../types/api';

type OrderForm = Record<string, string>;
const fields = [
  ['customerId', 'Customer ID'],
  ['employeeId', 'Employee ID'],
  ['orderDate', 'Order date'],
  ['requiredDate', 'Required date'],
  ['shippedDate', 'Shipped date'],
  ['shipVia', 'Shipper ID'],
  ['freight', 'Freight'],
  ['shipName', 'Ship name'],
  ['shipCity', 'Ship city'],
  ['shipCountry', 'Ship country'],
] as const;

export function OrdersPage() {
  const { canWrite } = useAuth();
  const writable = canWrite('orders');
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Order | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<OrderForm>({});
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [details, setDetails] = useState<OrderDetail[]>([]);
  const [detailEditing, setDetailEditing] = useState<OrderDetail | null>(null);
  const [detailForm, setDetailForm] = useState<OrderForm>({
    productId: '',
    unitPrice: '0',
    quantity: '1',
    discount: '0',
  });

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

  function begin(order: Order | null) {
    const values: OrderForm = {};
    for (const [name] of fields) {
      const value = order?.[name];
      values[name] = value === null || value === undefined ? '' : String(value);
    }
    values.productId = '';
    values.unitPrice = '0';
    values.quantity = '1';
    values.discount = '0';
    setForm(values);
    setEditing(order);
    setCreating(order === null);
  }

  async function save() {
    const body: Record<string, unknown> = {};
    for (const [name] of fields) {
      const value = form[name];
      body[name] = ['employeeId', 'shipVia', 'freight'].includes(name)
        ? value === ''
          ? name === 'freight'
            ? 0
            : null
          : Number(value)
        : value === ''
          ? null
          : value;
    }
    if (creating) {
      body.details = [
        {
          productId: Number(form.productId),
          unitPrice: Number(form.unitPrice),
          quantity: Number(form.quantity),
          discount: Number(form.discount),
        },
      ];
    }
    try {
      if (creating) await api.create('orders', body);
      else if (editing) await api.update('orders', editing.orderId, body);
      setCreating(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function openDetails(order: Order) {
    setError(null);
    setDetailOrder(order);
    try {
      const result = await api.list<OrderDetail>(`orders/${order.orderId}/details`);
      setDetails(result.items);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load line items');
    }
  }

  function editDetail(detail: OrderDetail | null) {
    setDetailEditing(detail);
    setDetailForm({
      productId: detail ? String(detail.productId) : '',
      unitPrice: detail ? String(detail.unitPrice) : '0',
      quantity: detail ? String(detail.quantity) : '1',
      discount: detail ? String(detail.discount) : '0',
    });
  }

  async function saveDetail() {
    if (!detailOrder) return;
    const resource = `orders/${detailOrder.orderId}/details`;
    const payload = {
      unitPrice: Number(detailForm.unitPrice),
      quantity: Number(detailForm.quantity),
      discount: Number(detailForm.discount),
    };
    try {
      if (detailEditing) await api.update(resource, detailEditing.productId, payload);
      else await api.create(resource, { productId: Number(detailForm.productId), ...payload });
      await openDetails(detailOrder);
      editDetail(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function removeDetail(detail: OrderDetail) {
    if (!detailOrder || !confirm(`Delete product ${detail.productId} from this order?`)) return;
    try {
      await api.remove(`orders/${detailOrder.orderId}/details`, detail.productId);
      await openDetails(detailOrder);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Orders</h1>
        {writable && (
          <button
            className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white"
            onClick={() => begin(null)}
          >
            + New
          </button>
        )}
      </div>
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
              <th className="px-4 py-2" />
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
                <td className="px-4 py-2 text-right">
                  <button
                    className="mr-3 text-brand-600 hover:underline"
                    onClick={() => void openDetails(o)}
                  >
                    Details
                  </button>
                  {writable && (
                    <>
                      <button
                        className="mr-3 text-brand-600 hover:underline"
                        onClick={() => begin(o)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => void remove(o.orderId)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
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
      {detailOrder && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Order {detailOrder.orderId} line items</h2>
            <button className="text-sm text-slate-500" onClick={() => setDetailOrder(null)}>
              Close
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {['Product', 'Unit price', 'Quantity', 'Discount', ''].map((heading) => (
                    <th key={heading} className="border-b px-2 py-2 text-left">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.map((detail) => (
                  <tr key={detail.productId}>
                    <td className="px-2 py-2">{detail.productId}</td>
                    <td className="px-2 py-2">${detail.unitPrice.toFixed(2)}</td>
                    <td className="px-2 py-2">{detail.quantity}</td>
                    <td className="px-2 py-2">{detail.discount}</td>
                    <td className="px-2 py-2 text-right">
                      {writable && (
                        <>
                          <button
                            className="mr-3 text-brand-600"
                            onClick={() => editDetail(detail)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600"
                            onClick={() => void removeDetail(detail)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {writable && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <h3 className="mb-2 text-sm font-semibold">
                {detailEditing ? `Edit product ${detailEditing.productId}` : 'Add line item'}
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {(
                  [
                    ['productId', 'Product ID'],
                    ['unitPrice', 'Unit price'],
                    ['quantity', 'Quantity'],
                    ['discount', 'Discount'],
                  ] as const
                ).map(([name, label]) => (
                  <label key={name} className="text-sm">
                    <span className="mb-1 block text-slate-600">{label}</span>
                    <input
                      type="number"
                      className="w-full rounded border border-slate-300 px-2 py-1"
                      disabled={name === 'productId' && detailEditing !== null}
                      value={detailForm[name] ?? ''}
                      onChange={(event) =>
                        setDetailForm((current) => ({ ...current, [name]: event.target.value }))
                      }
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white"
                  onClick={() => void saveDetail()}
                >
                  {detailEditing ? 'Save item' : 'Add item'}
                </button>
                {detailEditing && (
                  <button className="text-sm text-slate-600" onClick={() => editDetail(null)}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}
      {(creating || editing) && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {creating ? 'New order' : `Edit order ${editing?.orderId}`}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {fields.map(([name, label]) => (
                <label key={name} className="text-sm">
                  <span className="mb-1 block text-slate-600">{label}</span>
                  <input
                    className="w-full rounded border border-slate-300 px-2 py-1"
                    value={form[name] ?? ''}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [name]: event.target.value }))
                    }
                  />
                </label>
              ))}
            </div>
            {creating && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-sm font-semibold">Line item</h3>
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ['productId', 'Product ID'],
                      ['unitPrice', 'Unit price'],
                      ['quantity', 'Quantity'],
                      ['discount', 'Discount'],
                    ] as const
                  ).map(([name, label]) => (
                    <label key={name} className="text-sm">
                      <span className="mb-1 block text-slate-600">{label}</span>
                      <input
                        type="number"
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        value={form[name] ?? ''}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, [name]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded px-3 py-1.5 text-sm"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white"
                onClick={() => void save()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
