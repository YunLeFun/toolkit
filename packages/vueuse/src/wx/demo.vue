<script lang="ts" setup>
import { ref } from 'vue'
import { useWxJsApi } from '@yunlefun/vueuse'
import { isInWxBrowser, registerWxShare } from '@yunlefun/utils'

const wxDomain = 'https://wx.yunyoujun.cn'
const url = window?.location?.href?.split?.('#')?.[0]

const isReady = ref(false)
if (isInWxBrowser()) {
  const { isReady: isWxReady } = useWxJsApi({
    configUrl: `${wxDomain}/wx/config?url=${url}`,
    onReady: () => {
      registerWxShare({
        title: '@YunLeFun/vueuse',
        desc: 'Vue Composition API for Wx Share.',
        link: 'https://github.com/YunLeFun/toolkit/blob/main/packages/vueuse/?source=wx',
        imgUrl: 'https://cn.vuejs.org/logo.svg',
      })
    },
  })
  isReady.value = isWxReady.value
}
</script>

<template>
  <div>
    Wx Share Demo
    <div>
      Ready: {{ isReady }}
    </div>
  </div>
</template>
