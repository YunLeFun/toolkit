<script lang="ts" setup>
import type { WxJsApiOptions } from '@yunlefun/vueuse'
import { useWxJsApi } from '@yunlefun/vueuse'
import { registerWxShare } from '@yunlefun/utils'

const wxDomain = 'https://wx.yunyoujun.cn'
const url = window?.location?.href?.split?.('#')?.[0]

const { isReady } = useWxJsApi(async () => {
  const data = await fetch(`${wxDomain}/wx/config?url=${url}`)
    .then(res => res.json())

  const wxJsApiOptions: WxJsApiOptions = {
    config: {
      // debug: true,
      appId: 'wx80bfa39c2ebe26e8', // replace with your appId
      timestamp: data.timestamp,
      nonceStr: data.nonceStr,
      signature: data.signature,
      jsApiList: [
        'updateAppMessageShareData',
        'updateTimelineShareData',
      ],
    },
    onReady: () => {
      registerWxShare({
        title: '@YunLeFun/vueuse',
        desc: 'Vue Composition API for Wx Share.',
        link: 'https://github.com/YunLeFun/toolkit/blob/main/packages/vueuse/?source=wx',
        imgUrl: 'https://cn.vuejs.org/logo.svg',
      })
    },
  }

  return wxJsApiOptions
})
</script>

<template>
  <div>
    Wx Share Demo
    <div>
      Ready: {{ isReady }}
    </div>
  </div>
</template>
