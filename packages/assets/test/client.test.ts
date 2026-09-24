import { describe, expect, it, vi } from 'vitest'
import {
  AssetApiError,
  createAssetClient,
} from '../src'

const readyAsset = {
  assetId: 'ast_cover_1',
  createdAt: '2026-07-30T12:00:00.000Z',
  height: 1080,
  mimeType: 'image/webp',
  name: '封面.webp',
  preview: null,
  sha256: 'a'.repeat(64),
  sizeBytes: 1024,
  sourceAppId: 'everything-generator',
  status: 'ready',
  tags: ['Cover', '封面'],
  trashedAt: null,
  updatedAt: '2026-07-30T12:00:00.000Z',
  width: 1920,
}

describe('asset client', () => {
  it('uses AND tag filters and includes first-party credentials', async () => {
    const fetch = vi.fn(async () => Response.json({
      items: [readyAsset],
      nextCursor: null,
    }))
    const client = createAssetClient({
      baseUrl: 'https://drive.yunle.fun/api/v1/library/',
      fetch,
    })

    const result = await client.listAssets({
      query: '封面',
      tags: [' Cover ', 'cover', '封面'],
    })

    expect(result.items).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith(
      'https://drive.yunle.fun/api/v1/library/assets?limit=30&query=%E5%B0%81%E9%9D%A2&tag=Cover&tag=%E5%B0%81%E9%9D%A2',
      expect.objectContaining({
        credentials: 'include',
        method: 'GET',
      }),
    )
  })

  it('generates independent mutation keys without mutating configured headers and preserves explicit retry keys', async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(readyAsset))
    const headers = Object.freeze({ 'x-csrf-token': 'csrf' })
    const client = createAssetClient({ baseUrl: '/api/v1/library', fetch, headers })
    await client.trashAsset('ast_cover_1')
    await client.restoreAsset('ast_cover_1')
    const first = fetch.mock.calls[0]?.[1] as RequestInit | undefined
    const second = fetch.mock.calls[1]?.[1] as RequestInit | undefined
    expect(new Headers(first?.headers).get('idempotency-key')).toBeTruthy()
    expect(new Headers(first?.headers).get('idempotency-key')).not.toBe(new Headers(second?.headers).get('idempotency-key'))
    expect(headers).not.toHaveProperty('idempotency-key')
    const retryClient = createAssetClient({ baseUrl: '/api/v1/library', fetch, headers: { 'Idempotency-Key': 'fixed-retry-key-1234' } })
    await retryClient.trashAsset('ast_cover_1')
    expect(new Headers(fetch.mock.calls[2]?.[1]?.headers).get('idempotency-key')).toBe('fixed-retry-key-1234')
  })

  it('validates mutation inputs before sending them', async () => {
    const fetch = vi.fn()
    const client = createAssetClient({ baseUrl: '/api/v1/library', fetch })

    await expect(client.updateAsset('ast_cover_1', {})).rejects.toThrow('至少需要更新名称或标签')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('finalizes a direct upload without sending object storage coordinates', async () => {
    const fetch = vi.fn(async () => Response.json(readyAsset))
    const client = createAssetClient({ baseUrl: '/api/v1/library', fetch })

    await expect(client.completeUpload('upl_cover_1')).resolves.toMatchObject({
      assetId: 'ast_cover_1',
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/library/assets/uploads/upl_cover_1/complete',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('maps stable server errors into AssetApiError', async () => {
    const fetch = vi.fn(async () => Response.json({
      error: {
        code: 'ASSET_IN_USE',
        message: '素材仍被云端项目引用。',
        requestId: 'request-asset-1',
        retryable: false,
      },
    }, { status: 409 }))
    const client = createAssetClient({ baseUrl: '/api/v1/library', fetch })

    const result = client.purgeAsset('ast_cover_1')
    await expect(result).rejects.toBeInstanceOf(AssetApiError)
    await expect(result).rejects.toMatchObject({
      code: 'ASSET_IN_USE',
      requestId: 'request-asset-1',
      retryable: false,
      status: 409,
    })
  })

  it('rejects incompatible successful payloads at the boundary', async () => {
    const fetch = vi.fn(async () => Response.json({
      ...readyAsset,
      sha256: 'not-a-sha256',
    }))
    const client = createAssetClient({ baseUrl: '/api/v1/library', fetch })

    const result = client.getAsset('ast_cover_1')
    await expect(result).rejects.toBeInstanceOf(AssetApiError)
    await expect(result).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
  })
})
