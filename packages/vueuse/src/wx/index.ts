import { useScriptTag } from '@vueuse/core'

import type { RegisterWxShareInfoOptions } from '@yunlefun/utils'
import { registerWxShare, wxSdkCDN } from '@yunlefun/utils'

export interface WxShareOptions extends RegisterWxShareInfoOptions {}

/**
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
 * @param options
 */
export function useWxShare(options: WxShareOptions | (() => Promise<WxShareOptions>)) {
  useScriptTag(wxSdkCDN, async () => {
    let wxShareOptions = options
    if (typeof options === 'function')
      wxShareOptions = await options()

    registerWxShare(wxShareOptions as WxShareOptions)
  })
}
