const storage = require('./storage')
const { DEFAULT_EXAM_CONFIG } = require('../utils/constants')
const { calcDurationMinutes } = require('../utils/time-utils')

const KEY = 'exam_config'

function getExamConfig() {
  return { ...DEFAULT_EXAM_CONFIG, ...(storage.get(KEY) || {}) }
}

function setExamConfig(config) {
  const next = {
    ...DEFAULT_EXAM_CONFIG,
    ...config,
  }
  storage.set(KEY, next)
  return next
}

function getDurationMinutes(config) {
  const cfg = config || getExamConfig()
  return calcDurationMinutes(cfg.virtualStartTime, cfg.virtualEndTime)
}

module.exports = {
  getExamConfig,
  setExamConfig,
  getDurationMinutes,
}
