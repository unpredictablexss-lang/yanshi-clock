function pad2(n) {
  return String(n).padStart(2, '0')
}

function parseTimeToToday(timeStr) {
  const [h, m] = String(timeStr || '00:00').split(':').map(Number)
  const d = new Date()
  d.setHours(h || 0, m || 0, 0, 0)
  return d
}

function formatHMS(date) {
  if (!date) return '00:00:00'
  const d = date instanceof Date ? date : new Date(date)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function formatHM(dateOrStr) {
  if (typeof dateOrStr === 'string') return dateOrStr
  if (!dateOrStr) return '00:00'
  const d = dateOrStr instanceof Date ? dateOrStr : new Date(dateOrStr)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDuration(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

function formatMinutesReadable(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h <= 0) return `${m}分钟`
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分`
}

function calcDurationMinutes(startStr, endStr) {
  const start = parseTimeToToday(startStr)
  const end = parseTimeToToday(endStr)
  return Math.round((end.getTime() - start.getTime()) / 60000)
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date)
  return `${formatDate(d)} ${formatHM(d)}`
}

function getWeekStartDate(date) {
  const now = date ? new Date(date) : new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - diff)
  return formatDate(monday)
}

module.exports = {
  pad2,
  parseTimeToToday,
  formatHMS,
  formatHM,
  formatDuration,
  formatMinutesReadable,
  calcDurationMinutes,
  formatDate,
  formatDateTime,
  getWeekStartDate,
}
