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

export interface RegisterWxShareOptions extends WxShareInfo {
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

/**
 * Register Wx Share
 */
export function registerWxShare(shareOptions: RegisterWxShareOptions) {
  const wx = window.wx

  // 需在用户可能点击分享按钮前就先调用
  wx.updateAppMessageShareData({
    title: shareOptions.title,
    desc: shareOptions.desc,
    link: shareOptions.link,
    imgUrl: shareOptions.imgUrl,
    success: () => {
      shareOptions.onUpdateAppMessageShareDataSuccess?.()
    },
  })
  wx.updateTimelineShareData({
    title: shareOptions.title,
    desc: shareOptions.desc,
    link: shareOptions.link,
    imgUrl: shareOptions.imgUrl,
    success: () => {
      shareOptions.onUpdateTimelineShareDataSuccess?.()
    },
  })
}
