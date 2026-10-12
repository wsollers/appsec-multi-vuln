import { useState, type FormEvent } from 'react';
import { api, ApiClientError } from '../lib/apiClient';

export function ImportPage() {
  const [url, setUrl] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api.previewImport(url);
      setContent(result.content);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not load the preview');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold text-slate-800">Import preview</h1>
      <form className="flex gap-2" onSubmit={(event) => void preview(event)}>
        <input
          aria-label="Source URL"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          type="url"
          placeholder="https://example.com/catalog"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          required
        />
        <button
          className="rounded bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          disabled={busy}
        >
          Preview
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      {content && (
        <article
          className="mt-5 rounded border border-slate-200 bg-white p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </section>
  );
}
