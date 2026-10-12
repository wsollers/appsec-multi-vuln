import { Router } from 'express';
import { z } from 'zod';
import { fetchRemoteContent } from '../../util/remoteFetch.js';

const FetchSchema = z.object({ url: z.string().url().max(2048) });

export function buildUtilRouter(): Router {
  const router = Router();
  router.post('/fetch-preview', async (req, res, next) => {
    try {
      const { url } = FetchSchema.parse(req.body);
      const result = await fetchRemoteContent(url, {
        allowedHosts: req.ctx.config.outboundFetchAllowedHosts,
      });
      res.json({
        status: result.status,
        contentType: result.contentType,
        bytes: result.bytes,
        preview: result.bodyText.slice(0, 2000),
      });
    } catch (err) {
      next(err);
    }
  });
  return router;
}

export function buildImportsRouter(): Router {
  const router = Router();
  router.post('/preview', async (req, res, next) => {
    try {
      const { url } = FetchSchema.parse(req.body);
      const result = await fetchRemoteContent(url, {
        allowedHosts: req.ctx.config.outboundFetchAllowedHosts,
      });
      res.json({
        content: result.bodyText,
        status: result.status,
        contentType: result.contentType,
      });
    } catch (err) {
      next(err);
    }
  });
  return router;
}
