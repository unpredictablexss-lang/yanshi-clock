const storage = require('../store/storage')
const { parseTimeToToday, formatDate, formatHM, formatDateTime, getWeekStartDate } = require('../utils/time-utils')

const SESSION_KEY = 'timer_session'
const SESSION_VERSION = 1

function createSessionId() {
  return `exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createInitialState() {
  return {
    status: 'IDLE',
    virtualStartTime: null,
    virtualEndTime: null,
    durationMinutes: 0,
    realStartStamp: null,
    realPauseStamp: null,
    accumulatedPause: 0,
    speedRatio: 1.0,
    currentVirtualTime: null,
    elapsedMs: 0,
    remainingMs: 0,
    progress: 0,
    subjectName: '',
    sessionId: null,
    restoredRemainingMs: null,
  }
}

function configure(state, examConfig, prefs) {
  const start = parseTimeToToday(examConfig.virtualStartTime)
  const end = parseTimeToToday(examConfig.virtualEndTime)
  state.virtualStartTime = start
  state.virtualEndTime = end
  state.durationMinutes = Math.max(0, Math.round((end - start) / 60000))
  state.speedRatio = (prefs && prefs.speedRatio) || 1.0
  state.subjectName = examConfig.subjectName || ''
  if (state.status === 'IDLE' || state.status === 'FINISHED') {
    state.currentVirtualTime = new Date(start.getTime())
    state.elapsedMs = 0
    state.remainingMs = end - start
    state.progress = 0
  }
  return state
}

function recordExamStats(state) {
  const stats = storage.get('study_stats') || {
    totalExamCount: 0,
    totalExamMinutes: 0,
    weekExamCount: 0,
    weekStartDate: getWeekStartDate(),
    lastExamAt: null,
    history: [],
  }

  const currentWeekStart = getWeekStartDate()
  if (stats.weekStartDate !== currentWeekStart) {
    stats.weekExamCount = 0
    stats.weekStartDate = currentWeekStart
  }

  const durationMinutes = Math.ceil(state.durationMinutes || 0)
  const history = Array.isArray(stats.history) ? stats.history : []
  // 恢复计时时可能再次走到结束分支，以场次 ID 防止重复记录。
  if (state.sessionId && history.some((item) => item.sessionId === state.sessionId)) {
    return stats
  }
  stats.totalExamCount += 1
  stats.totalExamMinutes += durationMinutes
  stats.weekExamCount += 1
  stats.lastExamAt = formatDateTime(new Date())

  stats.history = history
  stats.history.unshift({
    sessionId: state.sessionId || createSessionId(),
    date: formatDate(new Date()),
    startTime: formatHM(state.virtualStartTime),
    endTime: formatHM(state.virtualEndTime),
    durationMinutes,
    subjectName: state.subjectName || '',
  })
  if (stats.history.length > 50) {
    stats.history = stats.history.slice(0, 50)
  }

  storage.set('study_stats', stats)
  return stats
}

function getStudyStats() {
  const stats = storage.get('study_stats') || {
    totalExamCount: 0,
    totalExamMinutes: 0,
    weekExamCount: 0,
    weekStartDate: getWeekStartDate(),
    lastExamAt: null,
    history: [],
  }
  const currentWeekStart = getWeekStartDate()
  if (stats.weekStartDate !== currentWeekStart) {
    stats.weekExamCount = 0
    stats.weekStartDate = currentWeekStart
    storage.set('study_stats', stats)
  }
  if (!Array.isArray(stats.history)) stats.history = []
  return stats
}

function clearStudyStats() {
  storage.remove('study_stats')
}

function refreshDerived(state) {
  if (!state.virtualStartTime || !state.virtualEndTime || !state.currentVirtualTime) {
    state.elapsedMs = 0
    state.remainingMs = 0
    state.progress = 0
    return state
  }
  const total = state.virtualEndTime.getTime() - state.virtualStartTime.getTime()
  state.elapsedMs = Math.max(0, state.currentVirtualTime.getTime() - state.virtualStartTime.getTime())
  state.remainingMs = Math.max(0, state.virtualEndTime.getTime() - state.currentVirtualTime.getTime())
  state.progress = total > 0 ? Math.min(1, state.elapsedMs / total) : 0
  return state
}

function calcCurrentVirtualTime(state) {
  if (state.status !== 'RUNNING') {
    return refreshDerived(state)
  }

  const realElapsed = Date.now() - state.realStartStamp - state.accumulatedPause
  const virtualElapsed = realElapsed * (state.speedRatio || 1)
  const now = new Date(state.virtualStartTime.getTime() + virtualElapsed)

  if (now >= state.virtualEndTime) {
    state.status = 'FINISHED'
    state.currentVirtualTime = new Date(state.virtualEndTime.getTime())
    refreshDerived(state)
    recordExamStats(state)
    clearSession()
    return state
  }

  state.currentVirtualTime = now
  return refreshDerived(state)
}

function start(state) {
  if (!state.virtualStartTime || !state.virtualEndTime) return state
  if (state.status === 'RUNNING') return state

  if (state.status === 'PAUSED') {
    return resume(state)
  }

  state.status = 'RUNNING'
  state.realStartStamp = Date.now()
  state.realPauseStamp = null
  state.accumulatedPause = 0
  state.currentVirtualTime = new Date(state.virtualStartTime.getTime())
  state.sessionId = createSessionId()
  persistSession(state)
  return refreshDerived(state)
}

function pause(state) {
  if (state.status !== 'RUNNING') return state
  state.status = 'PAUSED'
  state.realPauseStamp = Date.now()
  persistSession(state)
  return state
}

function resume(state) {
  if (state.status !== 'PAUSED') return state
  state.accumulatedPause += Date.now() - state.realPauseStamp
  state.realPauseStamp = null
  state.status = 'RUNNING'
  calcCurrentVirtualTime(state)
  persistSession(state)
  return state
}

function reset(state) {
  const keepStart = state.virtualStartTime
  const keepEnd = state.virtualEndTime
  const keepDuration = state.durationMinutes
  const keepSubject = state.subjectName
  const keepSpeed = state.speedRatio
  Object.assign(state, createInitialState())
  state.virtualStartTime = keepStart
  state.virtualEndTime = keepEnd
  state.durationMinutes = keepDuration
  state.subjectName = keepSubject
  state.speedRatio = keepSpeed
  if (keepStart) {
    state.currentVirtualTime = new Date(keepStart.getTime())
    state.remainingMs = keepEnd ? keepEnd.getTime() - keepStart.getTime() : 0
  }
  clearSession()
  return refreshDerived(state)
}

function onAppShow(state) {
  if (state.status === 'RUNNING') {
    return calcCurrentVirtualTime(state)
  }
  return state
}

function snapshot(state) {
  return {
    status: state.status,
    subjectName: state.subjectName || '',
    durationMinutes: state.durationMinutes || 0,
    progress: state.progress || 0,
    elapsedMs: state.elapsedMs || 0,
    remainingMs: state.remainingMs || 0,
    currentVirtualTime: state.currentVirtualTime ? state.currentVirtualTime.getTime() : null,
    virtualStartTime: state.virtualStartTime ? state.virtualStartTime.getTime() : null,
    virtualEndTime: state.virtualEndTime ? state.virtualEndTime.getTime() : null,
    realStartStamp: state.realStartStamp,
    realPauseStamp: state.realPauseStamp,
    accumulatedPause: state.accumulatedPause || 0,
    speedRatio: state.speedRatio || 1,
    sessionId: state.sessionId || null,
  }
}

function persistSession(state) {
  if (!state || (state.status !== 'RUNNING' && state.status !== 'PAUSED')) {
    clearSession()
    return false
  }
  return storage.set(SESSION_KEY, {
    version: SESSION_VERSION,
    savedAt: Date.now(),
    ...snapshot(state),
  })
}

function clearSession() {
  storage.remove(SESSION_KEY)
}

function restoreSession(state) {
  const saved = storage.get(SESSION_KEY)
  if (!saved || saved.version !== SESSION_VERSION) return false
  if (saved.status !== 'RUNNING' && saved.status !== 'PAUSED') {
    clearSession()
    return false
  }

  const startMs = Number(saved.virtualStartTime)
  const endMs = Number(saved.virtualEndTime)
  const currentMs = Number(saved.currentVirtualTime)
  const realStartStamp = Number(saved.realStartStamp)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs || !Number.isFinite(currentMs)) {
    clearSession()
    return false
  }
  if (saved.status === 'RUNNING' && !Number.isFinite(realStartStamp)) {
    clearSession()
    return false
  }

  state.status = saved.status
  state.virtualStartTime = new Date(startMs)
  state.virtualEndTime = new Date(endMs)
  state.durationMinutes = Number(saved.durationMinutes) || Math.round((endMs - startMs) / 60000)
  state.realStartStamp = Number.isFinite(realStartStamp) ? realStartStamp : null
  state.realPauseStamp = Number.isFinite(Number(saved.realPauseStamp)) ? Number(saved.realPauseStamp) : null
  state.accumulatedPause = Math.max(0, Number(saved.accumulatedPause) || 0)
  state.speedRatio = Math.max(0.1, Number(saved.speedRatio) || 1)
  state.currentVirtualTime = new Date(Math.min(endMs, Math.max(startMs, currentMs)))
  state.subjectName = String(saved.subjectName || '')
  state.sessionId = saved.sessionId || createSessionId()
  state.restoredRemainingMs = Number.isFinite(Number(saved.remainingMs)) ? Number(saved.remainingMs) : null
  refreshDerived(state)
  if (state.status === 'RUNNING') calcCurrentVirtualTime(state)
  return true
}

module.exports = {
  createInitialState,
  configure,
  calcCurrentVirtualTime,
  start,
  pause,
  resume,
  reset,
  onAppShow,
  recordExamStats,
  getStudyStats,
  clearStudyStats,
  snapshot,
  persistSession,
  restoreSession,
  clearSession,
}
