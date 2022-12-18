export const wxSdkCDN = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'

/**
 * @see https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html
 * 附录2-所有 JS 接口列表
 */
export const jsApiList = [
  'updateAppMessageShareData',
  'updateTimelineShareData',
  'onMenuShareWeibo',
  'onMenuShareQZone',
  'startRecord',
  'stopRecord',
  'onVoiceRecordEnd',
  'playVoice',
  'pauseVoice',
  'stopVoice',
  'onVoicePlayEnd',
  'uploadVoice',
  'downloadVoice',
  'chooseImage',
  'previewImage',
  'uploadImage',
  'downloadImage',
  'translateVoice',
  'getNetworkType',
  'openLocation',
  'getLocation',
  'hideOptionMenu',
  'showOptionMenu',
  'hideMenuItems',
  'showMenuItems',
  'hideAllNonBaseMenuItem',
  'showAllNonBaseMenuItem',
  'closeWindow',
  'scanQRCode',
  'chooseWXPay',
  'openProductSpecificView',
  'addCard',
  'chooseCard',
  'openCard',
] as const
