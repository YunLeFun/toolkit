import type { jsApiList } from './constants'

export interface WxShareInfo {
  /**
   * 分享标题
   */
  title: string
  /**
   * 分享描述
   */
  desc: string
  /**
   * 分享链接，该链接域名或路径必须与当前页面对应的公众号 JS 安全域名一致
   */
  link: string
  /**
   * 分享图标
   */
  imgUrl: string
}

export interface RegisterWxShareInfoOptions {
  /**
   * 通过 config 接口注入权限验证配置
   */
  config: {
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

  shareData: WxShareInfo & {
    /**
     * 自定义“分享给朋友”及“分享到QQ”按钮的分享内容 成功
     * @returns
     */
    onUpdateAppMessageShareDataSuccess?: () => void
    /**
     * 自定义“分享到朋友圈”及“分享到 QQ 空间”按钮的分享内容 成功
     * @returns
     */
    onUpdateTimelineShareDataSuccess?: () => void
  }
}
