import type { ApiError, Paginated } from '../types/api';

/**
 * Minimal API client. Attaches the bearer token and, for state-changing
 * requests, the anti-CSRF token read from the `csrf_token` cookie
 * (double-submit). Uses same-origin relative URLs (the dev server proxies to
 * the API), so no cross-origin credential handling is needed.
 */

const API_BASE = '/api/v1';

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match && match[1] ? decodeURIComponent(match[1]) : null;
}

let accessToken: string | null = null;
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

async function ensureCsrfToken(): Promise<string | null> {
  let token = readCookie('csrf_token');
  if (!token) {
    await fetch(`${API_BASE}/auth/csrf-token`, { credentials: 'same-origin' });
    token = readCookie('csrf_token');
  }
  return token;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (mutating) {
    const csrf = await ensureCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const err = parsed as ApiError | undefined;
    throw new ApiClientError(
      res.status,
      err?.error?.code ?? 'UNKNOWN',
      err?.error?.message ?? `Request failed (${res.status})`,
    );
  }
  return parsed as T;
}

export const api = {
  list: <T>(resource: string, query: Record<string, string> = {}) => {
    const qs = new URLSearchParams(query).toString();
    return request<Paginated<T>>('GET', `/${resource}${qs ? `?${qs}` : ''}`);
  },
  get: <T>(resource: string, id: string | number) => request<T>('GET', `/${resource}/${id}`),
  create: <T>(resource: string, body: unknown) => request<T>('POST', `/${resource}`, body),
  update: <T>(resource: string, id: string | number, body: unknown) =>
    request<T>('PUT', `/${resource}/${id}`, body),
  remove: (resource: string, id: string | number) => request<void>('DELETE', `/${resource}/${id}`),
  devLogin: (username: string) =>
    request<{ accessToken: string; user: import('../types/api').AuthenticatedUser }>(
      'POST',
      '/auth/dev/token',
      { username },
    ),
};
