/**
 * 是否在微信浏览器环境
 * @returns
 */
export function isInWxBrowser() {
  return /MicroMessenger/.test(navigator.userAgent)
}
