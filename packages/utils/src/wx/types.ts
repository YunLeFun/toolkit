import type { jsApiList } from './constants'

export interface WxConfig {
  /**
   * 开启调试模式,调用的所有 api 的返回值会在客户端 alert 出来，若要查看传入的参数，可以在 pc 端打开，参数信息会通过 log 打出，仅在 pc 端时才会打印。
   */
  debug?: boolean
  /**
   * 必填，公众号的唯一标识
   */
  appId: string
  /**
   * 必填，生成签名的时间戳
   */
  timestamp: string
  /**
   * 必填，生成签名的随机串
   */
  nonceStr: string
  /**
   * 必填，签名
   */
  signature: string
  /**
   * 必填，需要使用的 JS 接口列表
   */
  jsApiList: (typeof jsApiList)[number][]
}
