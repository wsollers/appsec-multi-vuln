import { Router } from 'express';
import { z } from 'zod';
import { requireUser } from '../middleware/auth.js';
import { Forbidden } from '../errors.js';
import { isAdmin } from '../../auth/rbac.js';
import { safeFetch } from '../../util/ssrfFetch.js';

/**
 * Demonstrates the SSRF-guarded outbound fetch utility (design §7, threat E2).
 * Admin-only. The target is validated against the configured host allow-list,
 * internal/link-local addresses are blocked, and redirects are not followed.
 */
export function buildUtilRouter(): Router {
  const router = Router();

  const FetchSchema = z.object({ url: z.string().url().max(2048) }).strict();

  router.post('/fetch-preview', async (req, res, next) => {
    try {
      const user = requireUser(req);
      if (!isAdmin(user)) throw Forbidden('Admin role required');
      const { url } = FetchSchema.parse(req.body);
      const result = await safeFetch(url, {
        allowedHosts: req.ctx.config.outboundFetchAllowedHosts,
        timeoutMs: 5000,
        maxBytes: 512_000,
      });
      res.json({
        status: result.status,
        contentType: result.contentType,
        bytes: result.bytes,
        // Body is returned as text; the SPA renders it escaped (no raw HTML).
        preview: result.bodyText.slice(0, 2000),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
