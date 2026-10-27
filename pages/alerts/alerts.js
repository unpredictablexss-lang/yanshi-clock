const { PRESET_ALERTS, SOUND_OPTIONS } = require('../../utils/constants')
const { getPresetFlags, setPresetFlags, syncRulesFromPrefs } = require('../../store/alert-rules')
const { getUserPrefs, setUserPrefs } = require('../../store/user-prefs')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-songyun',
    themeVars: '',
    presets: [],
    alertPopup: true,
    alertVibrate: true,
    alertSoundOn: false,
    alertSound: 'bell-copper',
    soundOptions: SOUND_OPTIONS,
    soundLabel: '铜铃轻响',
  },

  onShow() {
    this._load()
  },

  _load() {
    const flags = getPresetFlags()
    const prefs = getUserPrefs()
    const sound = SOUND_OPTIONS.find((s) => s.key === prefs.alertSound) || SOUND_OPTIONS[0]
    const themeKey = normalizeThemeKey(prefs.theme)
    this.setData({
      themeClass: themeClassName(themeKey),
      themeVars: buildThemeVars(themeKey),
      presets: PRESET_ALERTS.map((p) => ({
        ...p,
        enabled: !!flags[p.key],
      })),
      alertPopup: prefs.alertPopup !== false,
      alertVibrate: prefs.alertVibrate !== false,
      alertSoundOn: !!prefs.alertSoundOn,
      alertSound: prefs.alertSound || 'bell-copper',
      soundLabel: sound.label,
    })
  },

  onTogglePreset(e) {
    const key = e.currentTarget.dataset.key
    const flags = getPresetFlags()
    flags[key] = !!e.detail.value
    setPresetFlags(flags)
    const prefs = getUserPrefs()
    const rules = syncRulesFromPrefs(prefs)
    const app = getApp()
    app.globalData.alertRules = rules
    if (app.globalData.alertEngine) {
      app.globalData.alertEngine.setRules(rules)
      app.globalData.alertEngine.resetTriggers()
    }
    this._load()
  },

  onToggleAction(e) {
    const field = e.currentTarget.dataset.field
    const prefs = setUserPrefs({ [field]: !!e.detail.value })
    getApp().refreshPrefs(prefs)
    const rules = syncRulesFromPrefs(prefs)
    getApp().globalData.alertRules = rules
    if (getApp().globalData.alertEngine) {
      getApp().globalData.alertEngine.setRules(rules)
    }
    this._load()
  },

  onSoundPick(e) {
    const idx = Number(e.detail.value)
    const opt = SOUND_OPTIONS[idx]
    if (!opt) return
    const prefs = setUserPrefs({ alertSound: opt.key })
    getApp().refreshPrefs(prefs)
    syncRulesFromPrefs(prefs)
    this.setData({ alertSound: opt.key, soundLabel: opt.label })
  },

  onPreviewSound() {
    const app = getApp()
    if (!this.data.alertSoundOn || !app.globalData.userPrefs.soundEnabled) {
      wx.showToast({ title: '请先开启音效提醒和音效总控', icon: 'none' })
      return
    }
    const ok = app.globalData.audioEngine && app.globalData.audioEngine.playEffect(this.data.alertSound)
    if (!ok) wx.showToast({ title: '音效播放失败', icon: 'none' })
  },
})
