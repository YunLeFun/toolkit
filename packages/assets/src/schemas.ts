import { z } from 'zod'

/** Maximum number of unique tags accepted by one asset. */
export const MAX_ASSET_TAGS = 20

/** Maximum Unicode character count accepted by one asset tag. */
export const MAX_ASSET_TAG_LENGTH = 24

/** Shared account-level single-file ceiling. */
export const MAX_ASSET_BYTES = 200 * 1024 * 1024

/** Stable opaque identifier accepted at API boundaries. */
export const assetIdentifierSchema = z.string().trim().min(1).max(128).regex(/^[\w.:-]+$/u)
const dateTimeSchema = z.string().datetime({ offset: true })
const imageMimeTypeSchema = z.enum([
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
])
const rasterMimeTypeSchema = z.enum([
  'image/png',
  'image/webp',
])
const sha256Schema = z.string().trim().toLowerCase().regex(/^[a-f0-9]{64}$/u)
const secureUrlSchema = z.string().url().refine((value) => {
  try {
    return new URL(value).protocol === 'https:'
  }
  catch {
    return false
  }
}, { message: '资源能力必须使用 HTTPS。' })
const exactOriginSchema = z.string().url().refine((value) => {
  try {
    const url = new URL(value)
    const localDevelopment = url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    return url.origin === value
      && !url.username
      && !url.password
      && (url.protocol === 'https:' || localDevelopment)
  }
  catch {
    return false
  }
}, { message: 'Picker origin 必须是精确 HTTPS 来源或本地开发来源。' })

/** One manually assigned user-facing asset tag. */
export const assetTagSchema = z.string()
  .trim()
  .min(1)
  .refine(value => [...value].length <= MAX_ASSET_TAG_LENGTH, {
    message: `标签不能超过 ${MAX_ASSET_TAG_LENGTH} 个字符`,
  })

function asciiCaseInsensitiveKey(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[A-Z]/g, character => character.toLowerCase())
}

/** Normalizes tags while retaining display spelling and Chinese characters. */
export function normalizeAssetTags(input: readonly string[]): string[] {
  const parsed = z.array(assetTagSchema).max(MAX_ASSET_TAGS).parse(input)
  const seen = new Set<string>()
  return parsed.filter((tag) => {
    const key = asciiCaseInsensitiveKey(tag)
    if (seen.has(key))
      return false
    seen.add(key)
    return true
  })
}

/** Bounded tag list with trim and ASCII case-insensitive deduplication. */
export const assetTagsSchema = z.array(assetTagSchema)
  .max(MAX_ASSET_TAGS)
  .transform(normalizeAssetTags)

/** Lifecycle exposed by the shared asset catalog. */
export const assetStatusSchema = z.enum([
  'uploading',
  'processing',
  'ready',
  'failed',
  'trashed',
])

/** Immutable reference persisted by a consuming application. */
export const assetReferenceSchema = z.strictObject({
  assetId: assetIdentifierSchema,
  sha256: sha256Schema,
})

/** Safe raster preview metadata. URLs are requested separately. */
export const assetRasterPreviewSchema = z.strictObject({
  height: z.number().int().positive(),
  kind: z.literal('raster'),
  mimeType: rasterMimeTypeSchema,
  width: z.number().int().positive(),
})

/** Provider-neutral asset projection returned to first-party applications. */
export const assetSchema = z.strictObject({
  assetId: assetIdentifierSchema,
  createdAt: dateTimeSchema,
  height: z.number().int().positive().nullable(),
  mimeType: imageMimeTypeSchema,
  name: z.string().trim().min(1).max(255),
  preview: assetRasterPreviewSchema.nullable(),
  sha256: sha256Schema.nullable(),
  sizeBytes: z.number().int().positive().max(MAX_ASSET_BYTES),
  sourceAppId: assetIdentifierSchema.nullable(),
  status: assetStatusSchema,
  tags: assetTagsSchema,
  trashedAt: dateTimeSchema.nullable(),
  updatedAt: dateTimeSchema,
  width: z.number().int().positive().nullable(),
}).superRefine((asset, context) => {
  if (asset.status === 'ready' && !asset.sourceAppId)
    context.addIssue({ code: 'custom', message: '可用素材必须包含已认证的来源应用。', path: ['sourceAppId'] })

  if (asset.status === 'ready' && (!asset.width || !asset.height)) {
    context.addIssue({
      code: 'custom',
      message: '可用素材必须包含图片尺寸。',
      path: ['width'],
    })
  }
  if (asset.status === 'ready' && !asset.sha256) {
    context.addIssue({
      code: 'custom',
      message: '可用素材必须包含服务端确认的 SHA-256。',
      path: ['sha256'],
    })
  }
  if (asset.mimeType === 'image/svg+xml' && asset.status === 'ready' && !asset.preview) {
    context.addIssue({
      code: 'custom',
      message: '可用 SVG 素材必须包含服务端栅格预览。',
      path: ['preview'],
    })
  }
})

/** Stable usage record that protects one private source from permanent deletion. */
export const assetUsageSchema = z.strictObject({
  assetId: assetIdentifierSchema,
  consumerAppId: assetIdentifierSchema,
  createdAt: dateTimeSchema,
  fieldPath: z.string().trim().min(1).max(255),
  resourceId: assetIdentifierSchema,
  resourceType: assetIdentifierSchema,
})

/** Asset list filters. Multiple tags use AND semantics. */
export const listAssetsInputSchema = z.strictObject({
  cursor: z.string().trim().min(1).max(2048).optional(),
  limit: z.number().int().min(1).max(100).default(30),
  query: z.string().trim().max(120).optional(),
  status: assetStatusSchema.optional(),
  tags: assetTagsSchema.default([]),
})

/** Opaque-cursor asset page. */
export const assetPageSchema = z.strictObject({
  items: z.array(assetSchema),
  nextCursor: z.string().min(1).nullable(),
})

/** Metadata required before direct browser upload. */
export const createAssetUploadInputSchema = z.strictObject({
  mimeType: imageMimeTypeSchema,
  name: z.string().trim().min(1).max(255),
  sha256: sha256Schema,
  sizeBytes: z.number().int().positive().max(MAX_ASSET_BYTES),
  tags: assetTagsSchema.default([]),
})

/** Short-lived, exact-object browser upload capability. */
export const assetUploadIntentSchema = z.strictObject({
  assetId: assetIdentifierSchema,
  expiresAt: dateTimeSchema,
  headers: z.record(z.string(), z.string()),
  method: z.literal('PUT'),
  uploadId: assetIdentifierSchema,
  url: secureUrlSchema,
})

/** A same-owner content hit needs no second byte upload or quota reservation. */
export const assetUploadCreationSchema = z.union([
  assetUploadIntentSchema,
  z.strictObject({ asset: assetSchema, deduped: z.literal(true) }),
])

/** Editable metadata; binary identity remains immutable. */
export const updateAssetMetadataInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(255).optional(),
  tags: assetTagsSchema.optional(),
}).refine(input => input.name !== undefined || input.tags !== undefined, {
  message: '至少需要更新名称或标签。',
})

/** Authorized, short-lived access returned after an ownership check. */
export const assetAccessSchema = z.strictObject({
  action: z.enum(['download', 'preview']),
  contentDisposition: z.string().max(512).optional(),
  expiresAt: dateTimeSchema,
  mimeType: z.string().trim().min(1).max(160),
  url: secureUrlSchema,
}).superRefine((access, context) => {
  if (
    access.action === 'download'
    && access.mimeType === 'image/svg+xml'
    && !access.contentDisposition?.toLowerCase().startsWith('attachment;')
  ) {
    context.addIssue({
      code: 'custom',
      message: 'SVG 原稿只能通过附件方式下载。',
      path: ['contentDisposition'],
    })
  }
  if (access.action === 'preview' && access.mimeType === 'image/svg+xml') {
    context.addIssue({
      code: 'custom',
      message: 'SVG 预览必须返回栅格 MIME。',
      path: ['mimeType'],
    })
  }
})

/** Complete usage set owned by one persistent consumer resource. */
export const replaceAssetUsagesInputSchema = z.strictObject({
  consumerAppId: assetIdentifierSchema,
  resourceId: assetIdentifierSchema,
  resourceType: assetIdentifierSchema,
  usages: z.array(z.strictObject({
    assetId: assetIdentifierSchema,
    fieldPath: z.string().trim().min(1).max(255),
  })).max(100),
})

/** Result of an idempotent usage replace-set operation. */
export const replaceAssetUsagesResultSchema = z.strictObject({
  assetIds: z.array(assetIdentifierSchema),
  version: z.number().int().positive(),
})

/** Error envelope shared by Drive asset endpoints. */
export const assetApiErrorEnvelopeSchema = z.strictObject({
  error: z.strictObject({
    code: z.string().trim().min(1).max(64),
    details: z.record(z.string(), z.unknown()).optional(),
    message: z.string().trim().min(1).max(500),
    requestId: z.string().trim().min(1).max(128).optional(),
    retryable: z.boolean().default(false),
  }),
})

/** First-party application request sent to the Drive Picker popup. */
export const assetPickerRequestSchema = z.strictObject({
  appId: assetIdentifierSchema,
  constraints: z.strictObject({
    mimeTypes: z.array(imageMimeTypeSchema).max(4).default([
      'image/jpeg',
      'image/png',
      'image/webp',
    ]),
    multiple: z.literal(false).default(false),
  }).default({
    mimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    multiple: false,
  }),
  origin: exactOriginSchema,
  requestId: assetIdentifierSchema,
  type: z.literal('yunlefun.asset-picker.request'),
  version: z.literal(1),
})

/** Successful Picker response. It deliberately excludes signed URLs. */
export const assetPickerSuccessSchema = z.strictObject({
  assetId: assetIdentifierSchema,
  requestId: assetIdentifierSchema,
  sha256: sha256Schema,
  type: z.literal('yunlefun.asset-picker.success'),
  version: z.literal(1),
})

/** Cancelled or rejected Picker response. */
export const assetPickerErrorSchema = z.strictObject({
  code: z.enum(['CANCELLED', 'FORBIDDEN', 'INVALID_REQUEST', 'NOT_FOUND']),
  message: z.string().trim().min(1).max(200),
  requestId: assetIdentifierSchema,
  type: z.literal('yunlefun.asset-picker.error'),
  version: z.literal(1),
})

/** Complete postMessage response accepted from the Drive Picker. */
export const assetPickerResponseSchema = z.discriminatedUnion('type', [
  assetPickerSuccessSchema,
  assetPickerErrorSchema,
])

export type Asset = z.output<typeof assetSchema>
export type AssetAccess = z.output<typeof assetAccessSchema>
export type AssetPage = z.output<typeof assetPageSchema>
export type AssetPickerError = z.output<typeof assetPickerErrorSchema>
export type AssetPickerRequest = z.output<typeof assetPickerRequestSchema>
export type AssetPickerResponse = z.output<typeof assetPickerResponseSchema>
export type AssetPickerSuccess = z.output<typeof assetPickerSuccessSchema>
export type AssetReference = z.output<typeof assetReferenceSchema>
export type AssetStatus = z.output<typeof assetStatusSchema>
export type AssetUploadIntent = z.output<typeof assetUploadIntentSchema>
export type AssetUploadCreation = z.output<typeof assetUploadCreationSchema>
export type AssetUsage = z.output<typeof assetUsageSchema>
export type CreateAssetUploadInput = z.input<typeof createAssetUploadInputSchema>
export type ListAssetsInput = z.input<typeof listAssetsInputSchema>
export type ReplaceAssetUsagesInput = z.input<typeof replaceAssetUsagesInputSchema>
export type UpdateAssetMetadataInput = z.input<typeof updateAssetMetadataInputSchema>
