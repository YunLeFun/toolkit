/**
 * 是否在微信浏览器环境
 * @returns
 */
export const isInWxBrowser = () => {
  return /MicroMessenger/.test(navigator.userAgent)
}
