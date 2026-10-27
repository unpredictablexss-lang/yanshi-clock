const { calcDurationMinutes } = require('./time-utils')

const TASK_NAME_MAX = 12

function validateExamTime(startStr, endStr) {
  if (!startStr || !endStr) {
    return { ok: false, message: '请设置开考与结束时间' }
  }
  const minutes = calcDurationMinutes(startStr, endStr)
  if (minutes <= 0) {
    return { ok: false, message: '结束时间须晚于开考时间' }
  }
  if (minutes > 12 * 60) {
    return { ok: false, message: '单场考试时长不宜超过12小时' }
  }
  return { ok: true, minutes }
}

function validateTaskName(name) {
  const text = String(name || '').trim()
  if (!text) {
    return { ok: false, message: `请填写考试名（${TASK_NAME_MAX}字以内）` }
  }
  if ([...text].length > TASK_NAME_MAX) {
    return { ok: false, message: `考试名不超过${TASK_NAME_MAX}个字` }
  }
  return { ok: true, name: text }
}

module.exports = {
  validateExamTime,
  validateTaskName,
  TASK_NAME_MAX,
}
