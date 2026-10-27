const { DIAL_MODE_OPTIONS, NOISE_OPTIONS, APP_VERSION } = require('../../utils/constants')
const { formatMinutesReadable } = require('../../utils/time-utils')
const { getUserPrefs, setUserPrefs } = require('../../store/user-prefs')
const timerEngine = require('../../engine/timer-engine')
const storage = require('../../store/storage')
const { BANNER_AD_UNIT_ID } = require('../../utils/ad-manager')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-songyun',
    themeKey: 'songyun',
    themeVars: '',
    dialModes: DIAL_MODE_OPTIONS,
    dialMode: 'shichen-number',
    noiseOptions: NOISE_OPTIONS,
    currentNoise: 'rain-window',
    volume: 0.6,
    playing: false,
    keepScreenOn: true,
    soundEnabled: true,
    examEndSoundEnabled: true,
    vibrateEnabled: true,
    eyeCare: false,
    stats: {
      totalExamCount: 0,
      totalDurationText: '0分钟',
      weekExamCount: 0,
      lastExamAt: '暂无',
    },
    version: APP_VERSION,
    bannerAdUnitId: BANNER_AD_UNIT_ID,
    _themeBeforeEyeCare: 'songyun',
  },

  onShow() {
    const audio = getApp().globalData.audioEngine
    if (audio && audio.setNoiseListener) {
      audio.setNoiseListener(({ playing, error }) => {
        this.setData({ playing: !!playing })
        setUserPrefs({ noisePlaying: !!playing })
        if (error) wx.showToast({ title: '音频播放失败，请重试', icon: 'none' })
      })
    }
    this._load()
  },

  onHide() {
    const audio = getApp().globalData.audioEngine
    if (audio && audio.setNoiseListener) audio.setNoiseListener(null)
  },

  _load() {
    const prefs = getUserPrefs()
    const themeKey = normalizeThemeKey(prefs.theme)
    const raw = timerEngine.getStudyStats()
    const audio = getApp().globalData.audioEngine
    // 以音频引擎真实播放状态为准，避免重启后 prefs.noisePlaying 与无声不一致
    const playing = !!(audio && audio.isNoisePlaying && audio.isNoisePlaying())
    this.setData({
      themeClass: themeClassName(themeKey),
      themeKey,
      themeVars: buildThemeVars(themeKey),
      dialMode: prefs.dialMode,
      currentNoise: prefs.noiseKey || 'rain-window',
      volume: prefs.noiseVolume,
      playing,
      keepScreenOn: !!prefs.keepScreenOn,
      soundEnabled: !!prefs.soundEnabled,
      examEndSoundEnabled: prefs.examEndSoundEnabled !== false,
      vibrateEnabled: !!prefs.vibrateEnabled,
      eyeCare: themeKey === 'moyun',
      stats: {
        totalExamCount: raw.totalExamCount || 0,
        totalDurationText: formatMinutesReadable(raw.totalExamMinutes || 0),
        weekExamCount: raw.weekExamCount || 0,
        lastExamAt: raw.lastExamAt || '暂无',
      },
    })
  },

  onSelectTheme(e) {
    const theme = e.detail.theme
    getApp().refreshPrefs({ theme })
    this.setData({ _themeBeforeEyeCare: theme, eyeCare: false })
    this._load()
  },

  onSelectDial(e) {
    const dialMode = e.currentTarget.dataset.value
    getApp().refreshPrefs({ dialMode })
    this.setData({ dialMode })
  },

  onNoiseSelect(e) {
    const key = e.detail.key
    getApp().refreshPrefs({ noiseKey: key })
    this.setData({ currentNoise: key })
    if (this.data.playing) getApp().globalData.audioEngine.startNoise(key)
  },

  onNoiseToggle() {
    const app = getApp()
    const playing = !this.data.playing
    if (playing) {
      const started = app.globalData.audioEngine.startNoise(this.data.currentNoise)
      if (!started) {
        wx.showToast({ title: '音频启动失败，请重试', icon: 'none' })
        return
      }
    } else {
      app.globalData.audioEngine.stopNoise()
    }
    setUserPrefs({ noisePlaying: playing })
    this.setData({ playing })
  },

  onNoiseVolume(e) {
    const value = e.detail.value
    getApp().refreshPrefs({ noiseVolume: value })
    getApp().globalData.audioEngine.setNoiseVolume(value)
    this.setData({ volume: value })
  },

  onToggleKeepScreen(e) {
    getApp().refreshPrefs({ keepScreenOn: e.detail.value })
    this.setData({ keepScreenOn: e.detail.value })
  },

  onToggleEyeCare() {
    if (this.data.eyeCare) {
      const back = this.data._themeBeforeEyeCare || 'songyun'
      getApp().refreshPrefs({ theme: back === 'moyun' ? 'songyun' : back })
    } else {
      const cur = this.data.themeKey
      this.setData({ _themeBeforeEyeCare: cur === 'moyun' ? 'songyun' : cur })
      getApp().refreshPrefs({ theme: 'moyun' })
    }
    this._load()
  },

  onToggleSound(e) {
    getApp().refreshPrefs({ soundEnabled: e.detail.value })
    this.setData({ soundEnabled: e.detail.value })
  },

  onToggleExamEndSound(e) {
    getApp().refreshPrefs({ examEndSoundEnabled: e.detail.value })
    this.setData({ examEndSoundEnabled: e.detail.value })
  },

  onToggleVibrate(e) {
    getApp().refreshPrefs({ vibrateEnabled: e.detail.value })
    this.setData({ vibrateEnabled: e.detail.value })
  },

  onClearStats() {
    wx.showModal({
      title: '清空学习记录',
      content: '确认清空累计模考统计？不影响考试配置。',
      success: (res) => {
        if (!res.confirm) return
        timerEngine.clearStudyStats()
        this._load()
        wx.showToast({ title: '已清空', icon: 'success' })
      },
    })
  },

  onClearAll() {
    wx.showModal({
      title: '清空所有配置',
      content: '将清除考试配置、提醒、偏好与统计，不可恢复。',
      success: (res) => {
        if (!res.confirm) return
        const app = getApp()
        // 先停掉并销毁当前音频，再清存储 / 重建，避免旧 InnerAudio 继续播
        if (app.globalData.audioEngine) {
          try { app.globalData.audioEngine.destroy() } catch (e) { /* ignore */ }
          app.globalData.audioEngine = null
        }
        storage.clearAll()
        app.onLaunch()
        this._load()
        wx.showToast({ title: '已重置', icon: 'success' })
      },
    })
  },

  onGoSetup() { wx.navigateTo({ url: '/pages/setup/setup' }) },
  onGoAlerts() { wx.navigateTo({ url: '/pages/alerts/alerts' }) },
  onGoHistory() { wx.navigateTo({ url: '/pages/history/history' }) },
  onGoHelp() { wx.navigateTo({ url: '/pages/help/help' }) },
})
