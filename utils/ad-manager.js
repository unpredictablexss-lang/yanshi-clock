/**
 * 广告管理骨架：流量主开通并填入 adUnitId 后生效。
 * 未配置时静默跳过，不影响主功能。
 */
const INTERSTITIAL_AD_UNIT_ID = '' // 例如 adunit-xxxxxxxxxx
const BANNER_AD_UNIT_ID = ''

let interstitialAd = null

function ensureInterstitial() {
  if (!INTERSTITIAL_AD_UNIT_ID) return null
  if (interstitialAd) return interstitialAd
  if (!wx.createInterstitialAd) return null
  try {
    interstitialAd = wx.createInterstitialAd({ adUnitId: INTERSTITIAL_AD_UNIT_ID })
    interstitialAd.onError((err) => console.warn('插屏广告错误', err))
  } catch (e) {
    console.warn('创建插屏广告失败', e)
    interstitialAd = null
  }
  return interstitialAd
}

function showInterstitialAd() {
  const ad = ensureInterstitial()
  if (!ad) return Promise.resolve(false)
  return ad.show().then(() => true).catch((err) => {
    console.warn('插屏广告展示失败', err)
    return false
  })
}

module.exports = {
  BANNER_AD_UNIT_ID,
  INTERSTITIAL_AD_UNIT_ID,
  showInterstitialAd,
}
