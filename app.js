const timerEngine = require('./engine/timer-engine')
const { createAlertEngine } = require('./engine/alert-engine')
const { createAudioEngine } = require('./engine/audio-engine')
const { getExamConfig } = require('./store/exam-config')
const { getUserPrefs, setUserPrefs } = require('./store/user-prefs')
const { getAlertRules, syncRulesFromPrefs } = require('./store/alert-rules')
const { getTheme } = require('./utils/theme')

App({
  globalData: {
    timerState: null,
    alertEngine: null,
    audioEngine: null,
    examConfig: null,
    alertRules: [],
    userPrefs: null,
    theme: null,
  },

  onLaunch() {
    // 重入时先销毁旧音频，避免清空配置后旧白噪音继续播放
    if (this.globalData.audioEngine) {
      try { this.globalData.audioEngine.destroy() } catch (e) { /* ignore */ }
      this.globalData.audioEngine = null
    }

    let prefs = getUserPrefs()
    // 启动不自动恢复白噪音；持久化状态与真实播放对齐为未播放
    if (prefs.noisePlaying) {
      prefs = setUserPrefs({ noisePlaying: false })
    }

    const examConfig = getExamConfig()
    const alertRules = getAlertRules(prefs)

    const timerState = timerEngine.createInitialState()
    timerEngine.configure(timerState, examConfig, prefs)
    const restored = timerEngine.restoreSession(timerState)

    const alertEngine = createAlertEngine()
    alertEngine.setRules(alertRules)
    if (restored && timerState.restoredRemainingMs != null) {
      alertEngine.setBaseline(timerState.restoredRemainingMs)
      timerState.restoredRemainingMs = null
    }

    const audioEngine = createAudioEngine()
    audioEngine.setSoundEnabled(prefs.soundEnabled)
    audioEngine.setNoiseEnabled(true)
    audioEngine.setNoiseVolume(prefs.noiseVolume)

    this.globalData.timerState = timerState
    this.globalData.alertEngine = alertEngine
    this.globalData.audioEngine = audioEngine
    this.globalData.examConfig = examConfig
    this.globalData.alertRules = alertRules
    this.globalData.userPrefs = prefs
    this.globalData.theme = getTheme(prefs.theme)

    if (prefs.keepScreenOn) {
      wx.setKeepScreenOn({ keepScreenOn: true })
    }
  },

  onShow() {
    const { timerState } = this.globalData
    if (timerState) {
      timerEngine.onAppShow(timerState)
    }
  },

  onHide() {
    const { timerState } = this.globalData
    if (timerState) timerEngine.persistSession(timerState)
  },

  refreshPrefs(partial) {
    const next = setUserPrefs(partial || {})
    this.globalData.userPrefs = next
    this.globalData.theme = getTheme(next.theme)
    if (this.globalData.audioEngine) {
      this.globalData.audioEngine.setSoundEnabled(next.soundEnabled)
      this.globalData.audioEngine.setNoiseVolume(next.noiseVolume)
    }
    if (typeof next.keepScreenOn === 'boolean') {
      wx.setKeepScreenOn({ keepScreenOn: next.keepScreenOn })
    }
    const rules = syncRulesFromPrefs(next)
    this.globalData.alertRules = rules
    if (this.globalData.alertEngine) {
      this.globalData.alertEngine.setRules(rules)
    }
    return next
  },
})
