import { describe, it, expect } from 'vitest';
import { safeFetch } from '../../src/util/ssrfFetch.js';
import { AppError } from '../../src/http/errors.js';

const hosts = (h: string[]) => ({ allowedHosts: h, timeoutMs: 2000 });

describe('SSRF guard (threat E2)', () => {
  it('rejects a non-http(s) scheme', async () => {
    await expect(safeFetch('file:///etc/passwd', hosts(['localhost']))).rejects.toThrow(AppError);
  });

  it('rejects a host that is not on the allow-list', async () => {
    await expect(
      safeFetch('https://evil.example.com/data', hosts(['images.northwind.example.com'])),
    ).rejects.toThrow(/allow-list/);
  });

  it('rejects URLs embedding credentials', async () => {
    await expect(
      safeFetch('https://user:pass@images.northwind.example.com/x', hosts(['images.northwind.example.com'])),
    ).rejects.toThrow(/Credentials/);
  });

  it('blocks an allow-listed host that resolves to loopback (DNS rebinding)', async () => {
    // localhost resolves to 127.0.0.1 / ::1 — must be blocked even if allow-listed.
    await expect(safeFetch('http://localhost:9/x', hosts(['localhost']))).rejects.toThrow(
      /blocked|resolved/,
    );
  });

  it('blocks a direct internal IP literal', async () => {
    await expect(safeFetch('http://127.0.0.1/x', hosts(['127.0.0.1']))).rejects.toThrow(/blocked/);
  });

  it('blocks the cloud metadata address', async () => {
    await expect(
      safeFetch('http://169.254.169.254/latest/meta-data', hosts(['169.254.169.254'])),
    ).rejects.toThrow(/blocked/);
  });

  it('blocks private ranges (10.x, 192.168.x, 172.16-31.x)', async () => {
    for (const ip of ['10.0.0.5', '192.168.1.1', '172.16.0.9']) {
      await expect(safeFetch(`http://${ip}/x`, hosts([ip]))).rejects.toThrow(/blocked/);
    }
  });

  it('blocks IPv6 loopback', async () => {
    await expect(safeFetch('http://[::1]/x', hosts(['::1']))).rejects.toThrow(/blocked/);
  });
});
