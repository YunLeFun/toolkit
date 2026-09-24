import { describe, expect, it } from 'vitest'
import {
  MAX_ASSET_TAGS,
  assetPickerRequestSchema,
  assetPickerSuccessSchema,
  assetSchema,
  assetTagsSchema,
  createAssetUploadInputSchema,
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
  tags: ['封面'],
  trashedAt: null,
  updatedAt: '2026-07-30T12:00:00.000Z',
  width: 1920,
}

describe('asset schemas', () => {
  it('trims and deduplicates ASCII tag spelling without changing Chinese tags', () => {
    expect(assetTagsSchema.parse([' Cover ', 'cover', '封面', '封面']))
      .toEqual(['Cover', '封面'])
  })

  it('enforces bounded manual tags', () => {
    expect(() => assetTagsSchema.parse(Array.from({ length: MAX_ASSET_TAGS + 1 }, (_, index) => `tag-${index}`)))
      .toThrow()
    expect(() => assetTagsSchema.parse(['这是一条超过二十四个字符限制的素材标签名称不应该通过']))
      .toThrow()
  })

  it('requires a raster preview before an SVG can become ready', () => {
    expect(() => assetSchema.parse({
      ...readyAsset,
      mimeType: 'image/svg+xml',
    })).toThrow('可用 SVG 素材必须包含服务端栅格预览')

    expect(assetSchema.parse({
      ...readyAsset,
      mimeType: 'image/svg+xml',
      preview: {
        height: 1080,
        kind: 'raster',
        mimeType: 'image/webp',
        width: 1920,
      },
    })).toMatchObject({ status: 'ready' })
  })

  it('allows processing before hashing but requires a server hash when ready', () => {
    expect(assetSchema.parse({
      ...readyAsset,
      height: null,
      sha256: null,
      status: 'processing',
      width: null,
    })).toMatchObject({ sha256: null, status: 'processing' })

    expect(() => assetSchema.parse({
      ...readyAsset,
      sha256: null,
    })).toThrow('可用素材必须包含服务端确认的 SHA-256')
  })

  it('accepts only exact Picker origins and keeps selection single-item in v1', () => {
    const request = {
      appId: 'everything-generator',
      constraints: {},
      origin: 'https://dao.yunle.fun',
      requestId: 'request-cover-1',
      type: 'yunlefun.asset-picker.request',
      version: 1,
    }
    expect(assetPickerRequestSchema.parse(request)).toMatchObject({
      constraints: { multiple: false },
    })
    expect(() => assetPickerRequestSchema.parse({
      ...request,
      origin: 'https://dao.yunle.fun/cover',
    })).toThrow('Picker origin 必须是精确 HTTPS 来源')
    expect(() => assetPickerRequestSchema.parse({
      ...request,
      constraints: { multiple: true },
    })).toThrow()
  })

  it('derives sourceAppId from the authenticated consumer instead of upload input', () => {
    expect(() => createAssetUploadInputSchema.parse({
      mimeType: 'image/webp',
      name: '封面.webp',
      sizeBytes: 1024,
      sourceAppId: 'spoofed-app',
      tags: [],
    })).toThrow()
  })

  it('does not allow Picker responses to leak signed URLs', () => {
    expect(() => assetPickerSuccessSchema.parse({
      assetId: 'ast_cover_1',
      requestId: 'request-cover-1',
      sha256: 'a'.repeat(64),
      type: 'yunlefun.asset-picker.success',
      url: 'https://example.com/private-signed-url',
      version: 1,
    })).toThrow()
  })
})
