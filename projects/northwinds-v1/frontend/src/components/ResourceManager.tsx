import { useCallback, useEffect, useState } from 'react';
import { api, ApiClientError } from '../lib/apiClient';
import { useAuth } from '../lib/auth';
import type { Paginated } from '../types/api';

export type FieldType = 'text' | 'number' | 'checkbox';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Field is part of the create payload only (e.g. a client-supplied id). */
  createOnly?: boolean;
}

export interface ColumnDef<T> {
  header: string;
  render: (row: T) => string;
}

export interface ResourceConfig<T> {
  resource: string;
  title: string;
  idKey: keyof T;
  columns: ColumnDef<T>[];
  fields: FieldDef[];
}

interface Props<T> {
  config: ResourceConfig<T>;
}

type FormState = Record<string, string | number | boolean>;

/**
 * Generic list + create/edit/delete manager. All values render through React's
 * default text escaping — no `dangerouslySetInnerHTML` is used anywhere (design
 * §7, threat I5). Write controls are shown only when the server would allow the
 * action, but the server remains the source of truth.
 */
export function ResourceManager<T extends object>({ config }: Props<T>) {
  const { canWrite } = useAuth();
  const writable = canWrite(config.resource);
  const [data, setData] = useState<Paginated<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await api.list<T>(config.resource, { page: String(page), pageSize: '25' });
      setData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load');
    }
  }, [config.resource, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function startCreate() {
    const initial: FormState = {};
    for (const f of config.fields) initial[f.name] = f.type === 'checkbox' ? false : '';
    setForm(initial);
    setCreating(true);
    setEditing(null);
  }

  function startEdit(row: T) {
    const initial: FormState = {};
    const bag = row as Record<string, unknown>;
    for (const f of config.fields) {
      const value = bag[f.name];
      initial[f.name] =
        f.type === 'checkbox' ? Boolean(value) : value === null || value === undefined ? '' : String(value);
    }
    setForm(initial);
    setEditing(row);
    setCreating(false);
  }

  function buildPayload(isCreate: boolean): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      if (f.createOnly && !isCreate) continue;
      const raw = form[f.name];
      if (f.type === 'number') {
        payload[f.name] = raw === '' ? null : Number(raw);
      } else if (f.type === 'checkbox') {
        payload[f.name] = Boolean(raw);
      } else {
        payload[f.name] = raw === '' ? null : raw;
      }
    }
    return payload;
  }

  async function submit() {
    setError(null);
    try {
      if (creating) {
        await api.create(config.resource, buildPayload(true));
      } else if (editing) {
        await api.update(config.resource, String(editing[config.idKey]), buildPayload(false));
      }
      setCreating(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Save failed');
    }
  }

  async function remove(row: T) {
    if (!confirm('Delete this record?')) return;
    setError(null);
    try {
      await api.remove(config.resource, String(row[config.idKey]));
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Delete failed');
    }
  }

  const showForm = creating || editing !== null;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">{config.title}</h1>
        {writable && (
          <button
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            onClick={startCreate}
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
              {config.columns.map((c) => (
                <th key={c.header} className="px-4 py-2 text-left font-medium text-slate-500">
                  {c.header}
                </th>
              ))}
              {writable && <th className="px-4 py-2" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data?.items.map((row) => (
              <tr key={String(row[config.idKey])} className="hover:bg-slate-50">
                {config.columns.map((c) => (
                  <td key={c.header} className="px-4 py-2 text-slate-700">
                    {c.render(row)}
                  </td>
                ))}
                {writable && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      className="mr-2 text-brand-600 hover:underline"
                      onClick={() => startEdit(row)}
                    >
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => void remove(row)}>
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={config.columns.length + 1}>
                  No records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>
            {data.total} record(s) · page {data.page}
          </span>
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

      {showForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold">
              {creating ? `New ${config.title}` : `Edit ${config.title}`}
            </h2>
            <div className="space-y-3">
              {config.fields
                .filter((f) => creating || !f.createOnly)
                .map((f) => (
                  <label key={f.name} className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-600">{f.label}</span>
                    {f.type === 'checkbox' ? (
                      <input
                        type="checkbox"
                        checked={Boolean(form[f.name])}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.checked }))}
                      />
                    ) : (
                      <input
                        type={f.type === 'number' ? 'number' : 'text'}
                        className="w-full rounded border border-slate-300 px-2 py-1"
                        value={String(form[f.name] ?? '')}
                        onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                      />
                    )}
                  </label>
                ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              >
                Cancel
              </button>
              <button
                className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                onClick={() => void submit()}
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
