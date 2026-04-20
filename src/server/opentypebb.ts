/**
 * OpenTypeBB Mount Helper
 *
 * Merges opentypebb's REST router into an existing Hono app so market-data
 * endpoints live on the same port as the rest of the Alice web API.
 *
 * No standalone server: opentypebb is first-class inside Alice. Anyone who
 * wants it as a detached process can run `packages/opentypebb` directly.
 */

import type { Hono } from 'hono'
import {
  loadAllRouters,
  buildWidgetsJson,
  createRegistry,
  type QueryExecutor,
} from '@traderalice/opentypebb'

export interface MountOpenTypeBBOptions {
  /** URL prefix to mount routes under (e.g. `/api/market-data-v1`). */
  basePath: string
  /**
   * Credentials injected into every request that does not supply its own
   * `X-OpenBB-Credentials` header — typically the server-side provider keys.
   */
  defaultCredentials: Record<string, string>
}

export function mountOpenTypeBB(
  app: Hono,
  executor: QueryExecutor,
  opts: MountOpenTypeBBOptions,
): void {
  const rootRouter = loadAllRouters()
  const registry = createRegistry()

  rootRouter.mountToHono(app, executor, opts.basePath, opts.defaultCredentials)

  const widgetsJson = buildWidgetsJson(rootRouter, registry)
  app.get(`${opts.basePath}/widgets.json`, (c) => c.json(widgetsJson))

  console.log(
    `[opentypebb] mounted on ${opts.basePath} (${Object.keys(widgetsJson).length} widgets)`,
  )
}
