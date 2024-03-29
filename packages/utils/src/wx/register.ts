import { isClient } from '../common'
import { registerWxShare } from './jsApi'
import type { WxConfig } from './types'

export interface WxInitOptions {
  config?: Partial<WxConfig>
  onReady?: () => void
  onError?: (res: any) => void
}

/**
 * Create wx helpers
 * @param options
 */
export function createWx(options: WxInitOptions) {
  if (!isClient)
    return

  if (!window.wx)
    return

  const wx = window.wx
  wx.config(options.config)
  wx.ready(() => {
    options.onReady?.()
  })
  wx.error((res: any) => {
    options.onError?.(res)
  })

  return {
    registerWxShare,
  }
}
