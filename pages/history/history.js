const timerEngine = require('../../engine/timer-engine')
const { getUserPrefs } = require('../../store/user-prefs')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')
const { formatMinutesReadable } = require('../../utils/time-utils')

Page({
  data: {
    themeClass: 'theme-songyun',
    themeVars: '',
    records: [],
  },

  onShow() {
    const prefs = getUserPrefs()
    const themeKey = normalizeThemeKey(prefs.theme)
    const stats = timerEngine.getStudyStats()
    const history = Array.isArray(stats.history) ? stats.history : []
    this.setData({
      themeClass: themeClassName(themeKey),
      themeVars: buildThemeVars(themeKey),
      records: history.map((item, index) => ({
        ...item,
        rowKey: item.sessionId || `${item.date || ''}_${item.startTime || ''}_${index}`,
        subjectName: item.subjectName || '自定义考试',
        durationText: formatMinutesReadable(Number(item.durationMinutes) || 0),
      })),
    })
  },
})
