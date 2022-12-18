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
  wx.ready(() => {
    // 需在用户可能点击分享按钮前就先调用
    wx.updateAppMessageShareData({
      title: options.title,
      desc: options.desc,
      link: options.link,
      imgUrl: options.imgUrl,
      success: () => {
        options.onUpdateAppMessageShareDataSuccess?.()
      },
    })
    wx.updateTimelineShareData({
      title: options.title,
      desc: options.desc,
      link: options.link,
      imgUrl: options.imgUrl,
      success: () => {
        options.onUpdateTimelineShareDataSuccess?.()
      },
    })
  })
}
