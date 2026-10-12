import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { ApiClientError } from '../lib/apiClient';

const DEMO_USERS = [
  { username: 'admin', note: 'full access' },
  { username: 'sales_alice', note: 'sales — employee 1' },
  { username: 'sales_bob', note: 'sales — employee 3' },
  { username: 'viewer', note: 'read-only' },
];

export function LoginPage() {
  const { login, loginWithCode } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    window.history.replaceState({}, '', '/login');
    setBusy(true);
    void loginWithCode(code)
      .then(() => navigate('/products'))
      .catch((err: unknown) => {
        setError(err instanceof ApiClientError ? err.message : 'Sign-in failed');
        setBusy(false);
      });
  }, [loginWithCode, navigate]);

  async function signIn(name: string) {
    setBusy(true);
    setError(null);
    try {
      await login(name);
      navigate('/products');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  }

  function continueWithOAuth() {
    const redirectUri = `${window.location.origin}/login`;
    const query = new URLSearchParams({
      username,
      redirect_uri: redirectUri,
      state: String(Date.now()),
    });
    window.location.assign(`/api/v1/auth/oauth/authorize?${query}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="mb-1 text-xl font-semibold text-slate-800">Northwind Admin</h1>
        <p className="mb-5 text-sm text-slate-500">Northwind operations workspace</p>

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-slate-600">Developer sign-in</span>
          <input
            className="w-full rounded border border-slate-300 px-2 py-1.5"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <button
          className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          disabled={busy}
          onClick={() => void signIn(username)}
        >
          Sign in
        </button>
        <button
          className="mt-2 w-full rounded-md border border-brand-600 px-3 py-2 text-sm text-brand-700 disabled:opacity-50"
          disabled={busy}
          onClick={continueWithOAuth}
        >
          Continue with OAuth
        </button>

        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Demo accounts
          </p>
          <ul className="space-y-1 text-sm">
            {DEMO_USERS.map((u) => (
              <li key={u.username}>
                <button
                  className="text-brand-600 hover:underline disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void signIn(u.username)}
                >
                  {u.username}
                </button>
                <span className="text-slate-400"> — {u.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
