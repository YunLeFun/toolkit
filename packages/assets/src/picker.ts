import type { AssetPickerSuccess } from './schemas'
import { assetPickerRequestSchema, assetPickerResponseSchema } from './schemas'

export interface AssetPickerWindow {
  location: { origin: string }
  crypto: { randomUUID: () => string }
  open: (url: string, name: string, features: string) => { closed: boolean } | null
  addEventListener: (type: 'message', listener: (event: { source: unknown, origin: string, data: unknown }) => void) => void
  removeEventListener: (type: 'message', listener: (event: { source: unknown, origin: string, data: unknown }) => void) => void
}

export interface OpenAssetPickerOptions {
  appId: string
  /** Trusted Drive origin, for example https://drive.yunle.fun. */
  driveOrigin: string
  mimeTypes?: readonly ('image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml')[]
  /** Caller window is injectable for browser tests. */
  opener?: AssetPickerWindow
  timeoutMs?: number
}

/** Opens the first-party Picker and accepts only a response from that popup and Drive origin. */
export function openAssetPicker(options: OpenAssetPickerOptions): Promise<AssetPickerSuccess> {
  const opener = options.opener ?? globalThis as unknown as AssetPickerWindow
  const driveUrl = new URL(options.driveOrigin)
  const localDevelopment = driveUrl.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(driveUrl.hostname)
  if (driveUrl.origin !== options.driveOrigin || (driveUrl.protocol !== 'https:' && !localDevelopment))
    throw new Error('Drive Picker 必须使用精确 HTTPS 来源或本地开发来源。')
  const request = assetPickerRequestSchema.parse({
    appId: options.appId,
    origin: opener.location.origin,
    requestId: opener.crypto.randomUUID(),
    constraints: {
      mimeTypes: options.mimeTypes ? [...options.mimeTypes] : undefined,
      multiple: false,
    },
    type: 'yunlefun.asset-picker.request',
    version: 1,
  })
  const pickerUrl = new URL('/picker', driveUrl)
  pickerUrl.searchParams.set('appId', request.appId)
  pickerUrl.searchParams.set('origin', request.origin)
  pickerUrl.searchParams.set('requestId', request.requestId)
  for (const mimeType of request.constraints.mimeTypes)
    pickerUrl.searchParams.append('mimeType', mimeType)

  const popup = opener.open(pickerUrl.toString(), `asset-picker-${request.requestId}`, 'popup,width=1120,height=760')
  if (!popup)
    throw new Error('浏览器阻止了素材选择窗口。')

  return new Promise((resolve, reject) => {
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 5 * 60_000, 1_000), 30 * 60_000)
    const timer = setTimeout(() => finish(new Error('素材选择已超时。')), timeoutMs)
    const closedTimer = setInterval(() => {
      if (popup.closed)
        finish(new Error('素材选择窗口已关闭。'))
    }, 500)

    function finish(error?: Error, selected?: AssetPickerSuccess) {
      clearTimeout(timer)
      clearInterval(closedTimer)
      opener.removeEventListener('message', onMessage)
      if (error)
        reject(error)
      else if (selected)
        resolve(selected)
    }

    function onMessage(event: { source: unknown, origin: string, data: unknown }) {
      if (event.source !== popup || event.origin !== driveUrl.origin)
        return
      const parsed = assetPickerResponseSchema.safeParse(event.data)
      if (!parsed.success || parsed.data.requestId !== request.requestId)
        return
      if (parsed.data.type === 'yunlefun.asset-picker.error')
        finish(new Error(parsed.data.message))
      else
        finish(undefined, parsed.data)
    }

    opener.addEventListener('message', onMessage)
  })
}
