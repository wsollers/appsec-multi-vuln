import { BadRequest, Forbidden } from '../http/errors.js';

export interface SsrfFetchOptions {
  allowedHosts: readonly string[];
  timeoutMs?: number;
  maxBytes?: number;
}

export interface SafeFetchResult {
  status: number;
  contentType: string | null;
  bytes: number;
  bodyText: string;
}

export async function safeFetch(rawUrl: string, opts: SsrfFetchOptions): Promise<SafeFetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw BadRequest('Invalid URL');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw BadRequest('Unsupported URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 5000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const bodyText = await response.text();
    if (bodyText.length > (opts.maxBytes ?? 1_000_000)) throw Forbidden('Response too large');
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      bytes: Buffer.byteLength(bodyText),
      bodyText,
    };
  } finally {
    clearTimeout(timer);
  }
}
