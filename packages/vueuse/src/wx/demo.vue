<script lang="ts" setup>
import type { WxShareOptions } from '@yunlefun/vueuse'
import { useWxShare } from '@yunlefun/vueuse'

const wxDomain = 'https://wx.yunyoujun.cn'
const url = window?.location?.href?.split?.('#')?.[0]

useWxShare(async () => {
  const data = await fetch(`${wxDomain}/wx/config?url=${url}`)
    .then(res => res.json())

  const wxShareOptions: WxShareOptions = {
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
    title: '@YunLeFun/vueuse',
    desc: 'Vue Composition API for Wx Share.',
    link: 'https://github.com/YunLeFun/toolkit/blob/main/packages/vueuse/?source=wx',
    imgUrl: 'https://cn.vuejs.org/logo.svg',
  }
  return wxShareOptions
})
</script>

<template>
  <div>
    Wx Share Demo
  </div>
</template>
