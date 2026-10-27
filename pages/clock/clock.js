const timerEngine = require('../../engine/timer-engine')
const { formatHMS, formatDuration } = require('../../utils/time-utils')
const { STATUS_LABELS, TICK_INTERVAL_MS } = require('../../utils/constants')
const { getExamConfig } = require('../../store/exam-config')
const { getUserPrefs, setUserPrefs } = require('../../store/user-prefs')
const { showInterstitialAd } = require('../../utils/ad-manager')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-songyun',
    themeKey: 'songyun',
    themeVars: '',
    dialMode: 'shichen-number',
    clockMode: 'digital',
    fullscreen: false,
    timeText: '09:00:00',
    subjectName: '',
    status: 'IDLE',
    statusLabel: '待考',
    progress: 0,
    rangeText: '开考 09:00 → 结束 11:30',
    remainText: '00:00:00',
    elapsedText: '00:00:00',
    virtualTimeMs: null,
    showResetDialog: false,
    alertVisible: false,
    alertTitle: '',
    alertMessage: '',
    primaryBtnText: '开始',
  },

  onLoad() {
    this._bindAlertFire()
    this._syncFromStore(true)
  },

  onShow() {
    const app = getApp()
    timerEngine.onAppShow(app.globalData.timerState)
    this._syncFromStore(false)
    this._startTick()
    this._applyKeepScreen()
  },

  onUnload() {
    this._stopTick()
    wx.showTabBar({ animation: false })
    const state = getApp().globalData.timerState
    if (state) timerEngine.persistSession(state)
  },

  _bindAlertFire() {
    const app = getApp()
    if (!app.globalData.alertEngine) return
    app.globalData.alertEngine.onFire = (rule) => {
      const prefs = app.globalData.userPrefs || {}
      if (rule.actions && rule.actions.popup) {
        this.setData({
          alertVisible: true,
          alertTitle: '剩余 ' + rule.thresholdMinutes + ' 分钟',
          alertMessage: '请合理把控答题节奏',
        })
      }
      if (rule.actions && rule.actions.vibrate && prefs.vibrateEnabled) {
        wx.vibrateLong()
      }
      if (rule.actions && rule.actions.sound && prefs.soundEnabled && app.globalData.audioEngine) {
        app.globalData.audioEngine.playEffect(rule.actions.sound)
      }
    }
  },

  _applyKeepScreen() {
    const prefs = getApp().globalData.userPrefs || {}
    wx.setKeepScreenOn({ keepScreenOn: !!prefs.keepScreenOn })
  },

  _syncFromStore(reconfigure) {
    const app = getApp()
    if (!app.globalData.timerState) {
      app.globalData.timerState = timerEngine.createInitialState()
    }
    const examConfig = getExamConfig()
    const prefs = getUserPrefs()
    app.globalData.examConfig = examConfig
    app.globalData.userPrefs = prefs
    const themeKey = normalizeThemeKey(prefs.theme)
    const clockMode = prefs.clockMode === 'analog' ? 'analog' : 'digital'

    if (reconfigure || app.globalData.timerState.status === 'IDLE') {
      timerEngine.configure(app.globalData.timerState, examConfig, prefs)
    }

    this.setData({
      themeClass: themeClassName(themeKey),
      themeKey,
      themeVars: buildThemeVars(themeKey),
      dialMode: prefs.dialMode || 'shichen-number',
      clockMode,
      subjectName: examConfig.subjectName || '',
      rangeText: '开考 ' + formatHMS(app.globalData.timerState.virtualStartTime).slice(0, 5)
        + ' → 结束 ' + formatHMS(app.globalData.timerState.virtualEndTime).slice(0, 5),
    })
    this._paint(app.globalData.timerState)
  },

  _startTick() {
    this._stopTick()
    this._tick()
    this._timer = setInterval(() => this._tick(), TICK_INTERVAL_MS)
  },

  _stopTick() {
    if (this._timer) {
      clearInterval(this._timer)
      this._timer = null
    }
  },

  _tick() {
    const app = getApp()
    const state = app.globalData.timerState
    const prev = state.status
    timerEngine.calcCurrentVirtualTime(state)
    if (app.globalData.alertEngine) app.globalData.alertEngine.check(state)
    this._paint(state)
    this._persistTickCount = (this._persistTickCount || 0) + 1
    if (this._persistTickCount >= 10) {
      timerEngine.persistSession(state)
      this._persistTickCount = 0
    }
    if (prev !== 'FINISHED' && state.status === 'FINISHED') this._onExamFinished()
  },

  _paint(state) {
    const current = state.currentVirtualTime || state.virtualStartTime
    let primaryBtnText = '开始'
    if (state.status === 'RUNNING') primaryBtnText = '暂停'
    else if (state.status === 'PAUSED') primaryBtnText = '继续'
    else if (state.status === 'FINISHED') primaryBtnText = '已结束'

    this.setData({
      timeText: formatHMS(current),
      status: state.status,
      statusLabel: STATUS_LABELS[state.status] || state.status,
      progress: state.progress || 0,
      remainText: formatDuration(state.remainingMs || 0),
      elapsedText: formatDuration(state.elapsedMs || 0),
      virtualTimeMs: current ? current.getTime() : null,
      subjectName: state.subjectName || this.data.subjectName,
      primaryBtnText,
    })
  },

  _onExamFinished() {
    const app = getApp()
    const audio = app.globalData.audioEngine
    const prefs = app.globalData.userPrefs || {}
    if (audio && prefs.soundEnabled && prefs.examEndSoundEnabled !== false) {
      audio.playEffect('bell-copper')
    }
    wx.showToast({ title: '考试结束，辛苦了', icon: 'none', duration: 2000 })
    showInterstitialAd()
  },

  onPrimaryBtn() {
    const app = getApp()
    const state = app.globalData.timerState
    if (state.status === 'IDLE' || state.status === 'FINISHED') {
      if (state.status === 'FINISHED') {
        timerEngine.reset(state)
        if (app.globalData.alertEngine) app.globalData.alertEngine.resetTriggers()
      }
      timerEngine.configure(state, app.globalData.examConfig || getExamConfig(), app.globalData.userPrefs)
      if (app.globalData.alertEngine) app.globalData.alertEngine.resetTriggers()
      timerEngine.start(state)
    } else if (state.status === 'RUNNING') {
      timerEngine.pause(state)
    } else if (state.status === 'PAUSED') {
      timerEngine.resume(state)
    }
    this._paint(state)
  },

  onResetTap() { this.setData({ showResetDialog: true }) },
  onResetCancel() { this.setData({ showResetDialog: false }) },
  onResetConfirm() {
    const app = getApp()
    timerEngine.reset(app.globalData.timerState)
    if (app.globalData.alertEngine) app.globalData.alertEngine.resetTriggers()
    this.setData({ showResetDialog: false })
    this._paint(app.globalData.timerState)
  },

  onToggleClockMode() {
    const app = getApp()
    const next = app.globalData.userPrefs.clockMode === 'digital' ? 'analog' : 'digital'
    const prefs = setUserPrefs({ clockMode: next })
    app.globalData.userPrefs = prefs
    this.setData({ clockMode: next })
  },

  onToggleFullscreen() {
    const fullscreen = !this.data.fullscreen
    this.setData({ fullscreen })
    if (fullscreen) wx.hideTabBar({ animation: true })
    else wx.showTabBar({ animation: true })
  },
  onGoSetup() { wx.navigateTo({ url: '/pages/setup/setup' }) },
  onGoAlerts() { wx.navigateTo({ url: '/pages/alerts/alerts' }) },
  onAlertDismiss() { this.setData({ alertVisible: false }) },
})
