import { ref } from 'vue'
import { isClient, useScriptTag } from '@vueuse/core'
import type { WxInitOptions } from '@yunlefun/utils'
import { createWx, wxSdkCDN } from '@yunlefun/utils'

export interface WxJsApiOptions extends WxInitOptions {
  debug?: boolean
  /**
   * get config from server url
   */
  configUrl?: string
}

/**
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#1
 * 只在微信浏览器中使用，记得加 isInWxBrowser 判断
 */
export function useWxJsApi(
  options: WxJsApiOptions,
) {


  const isReady = ref(false)
  const error = ref()
  const wx = ref<ReturnType<typeof createWx>>()

  useScriptTag(wxSdkCDN, async () => {
    if (!isClient)
      return

    if (options.configUrl) {}

    if (!window.wx)
      return

    if (options.debug) {
      console.log('wxOptions', options)
    }

    let data: {
      timestamp?: string
      nonceStr?: string
      signature?: string
    } = {}
    if (options.configUrl) {
      data = await fetch(options.configUrl).then(
        (res) => res.json()
      );
      if (options.debug) {
        console.log('wx config data (fetch from configUrl)', data)
      }
    }
    

    wx.value = createWx({
      ...options,

      config: {
        appId: "wx80bfa39c2ebe26e8", // replace with your appId
        timestamp: data.timestamp,
        nonceStr: data.nonceStr,
        signature: data.signature,
        jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"],
        ...(options.config || {}),
      },

      onReady: () => {
        if (options.debug) {
          alert('wx ready')
        }
        isReady.value = true;
        options.onReady?.();
      },
      onError: (res) => {
        if (options.debug) {
          alert('wx error')
        }
        error.value = res;
        options.onError?.(res);
      },
    });
  })

  return {
    isReady,
    error,

    wx,
  }
}
