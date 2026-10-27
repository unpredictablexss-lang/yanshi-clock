const { EXAM_TEMPLATES } = require('../../utils/constants')
const { calcDurationMinutes, pad2 } = require('../../utils/time-utils')
const { validateExamTime, validateTaskName, TASK_NAME_MAX } = require('../../utils/validators')
const { getExamConfig, setExamConfig } = require('../../store/exam-config')
const { getUserPrefs } = require('../../store/user-prefs')
const timerEngine = require('../../engine/timer-engine')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')

function toPickerValue(timeStr) {
  const [h, m] = String(timeStr || '09:00').split(':').map(Number)
  return [h || 0, m || 0]
}

function fromPickerValue(val) {
  return `${pad2(val[0])}:${pad2(val[1])}`
}

Page({
  data: {
    themeClass: 'theme-songyun',
    themeVars: '',
    hours: Array.from({ length: 24 }, (_, i) => pad2(i)),
    minutes: Array.from({ length: 60 }, (_, i) => pad2(i)),
    startValue: [9, 0],
    endValue: [11, 30],
    startText: '09:00',
    endText: '11:30',
    durationText: '150 分钟',
    templates: EXAM_TEMPLATES,
    selectedId: '',
    taskName: '',
    taskNameMax: TASK_NAME_MAX,
  },

  onShow() {
    const prefs = getUserPrefs()
    const cfg = getExamConfig()
    const startValue = toPickerValue(cfg.virtualStartTime)
    const endValue = toPickerValue(cfg.virtualEndTime)
    const minutes = calcDurationMinutes(cfg.virtualStartTime, cfg.virtualEndTime)
    const themeKey = normalizeThemeKey(prefs.theme)
    const selectedId = cfg.templateId || ''
    const taskName = cfg.subjectName && cfg.subjectName !== '自定义考试'
      ? cfg.subjectName
      : ''
    this.setData({
      themeClass: themeClassName(themeKey),
      themeVars: buildThemeVars(themeKey),
      startValue,
      endValue,
      startText: cfg.virtualStartTime,
      endText: cfg.virtualEndTime,
      durationText: `${minutes} 分钟`,
      selectedId,
      taskName,
    })
  },

  onTaskNameInput(e) {
    const raw = String(e.detail.value || '')
    const chars = [...raw].slice(0, TASK_NAME_MAX)
    this.setData({ taskName: chars.join('') })
  },

  onStartChange(e) {
    const startText = fromPickerValue(e.detail.value)
    const minutes = calcDurationMinutes(startText, this.data.endText)
    this.setData({
      startValue: e.detail.value,
      startText,
      durationText: minutes > 0 ? `${minutes} 分钟` : '时间无效',
      selectedId: '',
    })
  },

  onEndChange(e) {
    const endText = fromPickerValue(e.detail.value)
    const minutes = calcDurationMinutes(this.data.startText, endText)
    this.setData({
      endValue: e.detail.value,
      endText,
      durationText: minutes > 0 ? `${minutes} 分钟` : '时间无效',
      selectedId: '',
    })
  },

  onSelectTemplate(e) {
    const tpl = e.detail.template
    if (!tpl) return
    const minutes = calcDurationMinutes(tpl.start, tpl.end)
    this.setData({
      selectedId: tpl.id,
      startText: tpl.start,
      endText: tpl.end,
      startValue: toPickerValue(tpl.start),
      endValue: toPickerValue(tpl.end),
      durationText: `${minutes} 分钟`,
      taskName: tpl.name,
    })
  },

  onSave() {
    const { startText, endText, selectedId, taskName } = this.data
    const check = validateExamTime(startText, endText)
    if (!check.ok) {
      wx.showModal({ title: '无法保存', content: check.message, showCancel: false })
      return
    }
    const nameCheck = validateTaskName(taskName)
    if (!nameCheck.ok) {
      wx.showModal({ title: '无法保存', content: nameCheck.message, showCancel: false })
      return
    }
    const subjectName = nameCheck.name
    const next = setExamConfig({
      virtualStartTime: startText,
      virtualEndTime: endText,
      templateId: selectedId || '',
      subjectName,
    })

    const app = getApp()
    app.globalData.examConfig = next
    if (app.globalData.timerState) {
      timerEngine.reset(app.globalData.timerState)
      timerEngine.configure(app.globalData.timerState, next, app.globalData.userPrefs)
    }
    if (app.globalData.alertEngine) app.globalData.alertEngine.resetTriggers()

    wx.showToast({ title: '已应用', icon: 'success' })
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/clock/clock' }) })
  },
})
