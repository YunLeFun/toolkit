/**
 * 是否在微信浏览器环境
 */
export function isInWxBrowser() {
  return /MicroMessenger/.test(navigator.userAgent)
}
