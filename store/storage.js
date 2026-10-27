const PREFIX = 'yskc_'

module.exports = {
  get(key) {
    try {
      const value = wx.getStorageSync(PREFIX + key)
      return value === '' || value === undefined ? null : value
    } catch (e) {
      console.warn('storage.get failed', key, e)
      return null
    }
  },
  set(key, value) {
    try {
      wx.setStorageSync(PREFIX + key, value)
      return true
    } catch (e) {
      console.warn('storage.set failed', key, e)
      return false
    }
  },
  remove(key) {
    try {
      wx.removeStorageSync(PREFIX + key)
    } catch (e) {
      console.warn('storage.remove failed', key, e)
    }
  },
  clearAll() {
    try {
      const info = wx.getStorageInfoSync()
      ;(info.keys || [])
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => wx.removeStorageSync(k))
    } catch (e) {
      console.warn('storage.clearAll failed', e)
    }
  },
}
