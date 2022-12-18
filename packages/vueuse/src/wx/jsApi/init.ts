import { ref } from 'vue'
import { isClient, useScriptTag } from '@vueuse/core'
import type { WxInitOptions } from '@yunlefun/utils'
import { createWx, wxSdkCDN } from '@yunlefun/utils'

export interface WxJsApiOptions extends WxInitOptions {}

/**
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#1
 */
export function useWxJsApi(options: WxJsApiOptions | (() => Promise<WxJsApiOptions>)) {
  const isReady = ref(false)
  const error = ref()
  const wx = ref<ReturnType<typeof createWx>>()

  useScriptTag(wxSdkCDN, async () => {
    if (!isClient)
      return

    if (!window.wx)
      return

    let wxOptions = options as WxJsApiOptions
    if (typeof options === 'function')
      wxOptions = (await options()) as WxJsApiOptions

    wx.value = createWx({
      ...wxOptions as WxJsApiOptions,
      onReady: () => {
        isReady.value = true
        wxOptions.onReady?.()
      },
      onError: (res) => {
        error.value = res
        wxOptions.onError?.(res)
      },
    })
  })

  return {
    isReady,
    error,

    wx,
  }
}
