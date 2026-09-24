import type { z } from 'zod'
import {
  assetAccessSchema,
  assetApiErrorEnvelopeSchema,
  assetIdentifierSchema,
  assetPageSchema,
  assetSchema,
  assetUploadCreationSchema,
  createAssetUploadInputSchema,
  listAssetsInputSchema,
  replaceAssetUsagesInputSchema,
  replaceAssetUsagesResultSchema,
  updateAssetMetadataInputSchema,
} from './schemas'

/** Fetch-compatible transport accepted in browsers, SSR, and tests. */
export type AssetFetch = (input: string, init?: RequestInit) => Promise<Response>

/** Fetch credential modes supported by browsers and compatible runtimes. */
export type AssetRequestCredentials = 'include' | 'omit' | 'same-origin'

/** Stable client failure with retry and request correlation metadata. */
export class AssetApiError extends Error {
  readonly code: string
  readonly details?: Record<string, unknown>
  readonly requestId?: string
  readonly retryable: boolean
  readonly status: number

  constructor(input: {
    code: string
    details?: Record<string, unknown>
    message: string
    requestId?: string
    retryable?: boolean
    status: number
  }) {
    super(input.message)
    this.name = 'AssetApiError'
    this.code = input.code
    this.details = input.details
    this.requestId = input.requestId
    this.retryable = input.retryable ?? false
    this.status = input.status
  }
}

/** Runtime options for the provider-neutral asset client. */
export interface AssetClientOptions {
  /** Absolute or same-origin base such as `https://drive.yunle.fun/api/v1/library`. */
  baseUrl: string
  /** Browser cookie policy. First-party Drive calls default to `include`. */
  credentials?: AssetRequestCredentials
  /** Injectable transport for SSR and tests. */
  fetch?: AssetFetch
  /** Additional non-secret headers or a lazy header resolver. */
  headers?: Record<string, string> | (() => Promise<Record<string, string>> | Record<string, string>)
}

/** Public asset API used by Drive, Cover, CMS, and AdvJS integrations. */
export interface AssetClient {
  completeUpload: (uploadId: string) => Promise<z.output<typeof assetSchema>>
  createAccess: (assetId: string, action: 'download' | 'preview') => Promise<z.output<typeof assetAccessSchema>>
  createUpload: (input: z.input<typeof createAssetUploadInputSchema>) => Promise<z.output<typeof assetUploadCreationSchema>>
  getAsset: (assetId: string) => Promise<z.output<typeof assetSchema>>
  listAssets: (input?: z.input<typeof listAssetsInputSchema>) => Promise<z.output<typeof assetPageSchema>>
  purgeAsset: (assetId: string) => Promise<void>
  replaceUsages: (input: z.input<typeof replaceAssetUsagesInputSchema>) => Promise<z.output<typeof replaceAssetUsagesResultSchema>>
  restoreAsset: (assetId: string) => Promise<z.output<typeof assetSchema>>
  trashAsset: (assetId: string) => Promise<z.output<typeof assetSchema>>
  updateAsset: (assetId: string, input: z.input<typeof updateAssetMetadataInputSchema>) => Promise<z.output<typeof assetSchema>>
}

/** Creates a Zod-validated client without provider credentials or storage details. */
export function createAssetClient(options: AssetClientOptions): AssetClient {
  const baseUrl = options.baseUrl.replace(/\/+$/u, '')
  if (!baseUrl)
    throw new AssetApiError({ code: 'INVALID_CONFIG', message: '素材 API 地址不能为空。', status: 0 })
  const fetch = options.fetch ?? globalThis.fetch.bind(globalThis)

  async function resolveHeaders(): Promise<Record<string, string>> {
    return typeof options.headers === 'function'
      ? await options.headers()
      : options.headers ?? {}
  }

  function identifier(value: string): string {
    return encodeURIComponent(assetIdentifierSchema.parse(value))
  }

  async function request<T>(
    path: string,
    init: RequestInit,
    schema: z.ZodType<T>,
  ): Promise<T> {
    const headers = { ...await resolveHeaders() }
    if (init.method && !['GET', 'HEAD'].includes(init.method) && !Object.keys(headers).some(name => name.toLowerCase() === 'idempotency-key'))
      headers['idempotency-key'] = globalThis.crypto.randomUUID()
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials: options.credentials ?? 'include',
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...headers,
        ...init.headers,
      },
    }).catch((error: unknown) => {
      throw new AssetApiError({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : '素材服务暂时不可用。',
        retryable: true,
        status: 0,
      })
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      const parsed = assetApiErrorEnvelopeSchema.safeParse(payload)
      if (parsed.success) {
        throw new AssetApiError({
          ...parsed.data.error,
          status: response.status,
        })
      }
      throw new AssetApiError({
        code: 'HTTP_ERROR',
        message: `素材服务请求失败（${response.status}）。`,
        retryable: response.status >= 500,
        status: response.status,
      })
    }

    if (response.status === 204)
      return undefined as T

    const payload = await response.json().catch(() => null)
    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      throw new AssetApiError({
        code: 'INVALID_RESPONSE',
        details: { issues: parsed.error.issues },
        message: '素材服务返回了不兼容的数据。',
        status: response.status,
      })
    }
    return parsed.data
  }

  return {
    async completeUpload(uploadId) {
      return await request(`/assets/uploads/${identifier(uploadId)}/complete`, {
        method: 'POST',
      }, assetSchema)
    },
    async createAccess(assetId, action) {
      return await request(`/assets/${identifier(assetId)}/access`, {
        body: JSON.stringify({ action }),
        method: 'POST',
      }, assetAccessSchema)
    },
    async createUpload(input) {
      const value = createAssetUploadInputSchema.parse(input)
      return await request('/assets/uploads', {
        body: JSON.stringify(value),
        method: 'POST',
      }, assetUploadCreationSchema)
    },
    async getAsset(assetId) {
      return await request(`/assets/${identifier(assetId)}`, {
        method: 'GET',
      }, assetSchema)
    },
    async listAssets(input = {}) {
      const value = listAssetsInputSchema.parse(input)
      const search = new URLSearchParams({ limit: String(value.limit) })
      if (value.cursor)
        search.set('cursor', value.cursor)
      if (value.query)
        search.set('query', value.query)
      if (value.status)
        search.set('status', value.status)
      for (const tag of value.tags)
        search.append('tag', tag)
      return await request(`/assets?${search.toString()}`, {
        method: 'GET',
      }, assetPageSchema)
    },
    async purgeAsset(assetId) {
      return await request(`/assets/${identifier(assetId)}`, {
        method: 'DELETE',
      }, assetSchema.optional().transform(() => undefined))
    },
    async replaceUsages(input) {
      const value = replaceAssetUsagesInputSchema.parse(input)
      const key = [
        value.consumerAppId,
        value.resourceType,
        value.resourceId,
      ].map(encodeURIComponent).join('/')
      return await request(`/asset-usages/${key}`, {
        body: JSON.stringify({ usages: value.usages }),
        method: 'PUT',
      }, replaceAssetUsagesResultSchema)
    },
    async restoreAsset(assetId) {
      return await request(`/assets/${identifier(assetId)}/restore`, {
        method: 'POST',
      }, assetSchema)
    },
    async trashAsset(assetId) {
      return await request(`/assets/${identifier(assetId)}/trash`, {
        method: 'POST',
      }, assetSchema)
    },
    async updateAsset(assetId, input) {
      const value = updateAssetMetadataInputSchema.parse(input)
      return await request(`/assets/${identifier(assetId)}`, {
        body: JSON.stringify(value),
        method: 'PATCH',
      }, assetSchema)
    },
  }
}
