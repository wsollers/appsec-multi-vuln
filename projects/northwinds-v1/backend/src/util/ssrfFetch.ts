import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { BadRequest, Forbidden } from '../http/errors.js';

/**
 * SSRF-guarded outbound fetch (design §7, threats E2/SSRF).
 *
 * Controls:
 *  - scheme allow-list (http/https only),
 *  - host allow-list (exact hostnames the server is configured to fetch),
 *  - DNS resolution of the host with rejection of private / loopback /
 *    link-local / reserved address ranges (blocks DNS-rebinding to internal IPs),
 *  - redirects are NOT followed (redirect: 'manual'); a 3xx is surfaced, never chased,
 *  - a hard response size cap and timeout.
 */

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

function ipIsBlocked(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return ipv4Blocked(ip);
  if (kind === 6) return ipv6Blocked(ip);
  return true; // not a parseable IP → block
}

function ipv4Blocked(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts as [number, number, number, number];
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function ipv6Blocked(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true; // loopback / unspecified
  if (lower.startsWith('fe80')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  // IPv4-mapped (::ffff:a.b.c.d) → validate the embedded v4 address
  const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped && mapped[1]) return ipv4Blocked(mapped[1]);
  return false;
}

export async function safeFetch(
  rawUrl: string,
  opts: SsrfFetchOptions,
): Promise<SafeFetchResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw BadRequest('Invalid URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw Forbidden('Only http(s) URLs may be fetched');
  }
  if (url.username || url.password) {
    throw Forbidden('Credentials in URL are not permitted');
  }

  // WHATWG URL keeps IPv6 hosts in brackets (e.g. "[::1]"); strip them so the
  // allow-list and IP checks operate on the canonical address.
  const host = url.hostname.replace(/^\[|\]$/gu, '').toLowerCase();
  if (!opts.allowedHosts.map((h) => h.toLowerCase()).includes(host)) {
    throw Forbidden('Target host is not on the fetch allow-list');
  }

  // Resolve the host and ensure EVERY resolved address is public.
  if (isIP(host) === 0) {
    const records = await lookup(host, { all: true }).catch(() => []);
    if (records.length === 0) throw Forbidden('Host could not be resolved');
    for (const rec of records) {
      if (ipIsBlocked(rec.address)) {
        throw Forbidden('Target resolves to a blocked (internal) address');
      }
    }
  } else if (ipIsBlocked(host)) {
    throw Forbidden('Target resolves to a blocked (internal) address');
  }

  const timeoutMs = opts.timeoutMs ?? 5000;
  const maxBytes = opts.maxBytes ?? 1_000_000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual', // never follow redirects blindly
      signal: controller.signal,
      headers: { accept: 'application/json, text/plain, */*' },
    });

    if (res.status >= 300 && res.status < 400) {
      throw Forbidden('Redirects are not followed');
    }

    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          received += value.byteLength;
          if (received > maxBytes) {
            await reader.cancel();
            throw Forbidden('Response exceeds maximum allowed size');
          }
          chunks.push(value);
        }
      }
    }
    const body = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return {
      status: res.status,
      contentType: res.headers.get('content-type'),
      bytes: received,
      bodyText: body.toString('utf8'),
    };
  } finally {
    clearTimeout(timer);
  }
}
