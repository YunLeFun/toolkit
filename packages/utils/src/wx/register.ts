import { isClient } from '../common'
import type { RegisterWxShareInfoOptions } from './types'

/**
 * Register Wx Share
 * @param options
 * @returns
 */
export const registerWxShare = (options: RegisterWxShareInfoOptions) => {
  if (!isClient)
    return

  if (!window.wx)
    return

  const wx = window.wx
  wx.config(options.config)

  const shareData = options.shareData
  wx.ready(() => {
    // 需在用户可能点击分享按钮前就先调用
    wx.updateAppMessageShareData({
      title: shareData.title,
      desc: shareData.desc,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => {
        shareData.onUpdateAppMessageShareDataSuccess?.()
      },
    })
    wx.updateTimelineShareData({
      title: shareData.title,
      desc: shareData.desc,
      link: shareData.link,
      imgUrl: shareData.imgUrl,
      success: () => {
        shareData.onUpdateTimelineShareDataSuccess?.()
      },
    })
  })
}
