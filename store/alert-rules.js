const storage = require('./storage')
const { PRESET_ALERTS, DEFAULT_PRESET_FLAGS, DEFAULT_USER_PREFS } = require('../utils/constants')

const RULES_KEY = 'alert_rules'
const FLAGS_KEY = 'preset_alert_flags'

function buildRulesFromFlags(flags, prefs) {
  const f = { ...DEFAULT_PRESET_FLAGS, ...(flags || {}) }
  const p = prefs || {}
  return PRESET_ALERTS.map((item) => ({
    id: item.key,
    name: item.name,
    thresholdMinutes: item.minutes,
    enabled: !!f[item.key],
    triggered: false,
    actions: {
      popup: p.alertPopup !== false,
      vibrate: p.alertVibrate !== false,
      sound: p.alertSoundOn ? (p.alertSound || DEFAULT_USER_PREFS.alertSound) : null,
    },
  }))
}

function getPresetFlags() {
  return { ...DEFAULT_PRESET_FLAGS, ...(storage.get(FLAGS_KEY) || {}) }
}

function setPresetFlags(flags) {
  const next = { ...DEFAULT_PRESET_FLAGS, ...flags }
  storage.set(FLAGS_KEY, next)
  return next
}

function getAlertRules(prefs) {
  const saved = storage.get(RULES_KEY)
  if (Array.isArray(saved) && saved.length) {
    return saved.map((r) => ({ ...r, triggered: false }))
  }
  return buildRulesFromFlags(getPresetFlags(), prefs)
}

function saveAlertRules(rules) {
  storage.set(RULES_KEY, rules)
  return rules
}

function syncRulesFromPrefs(prefs) {
  const rules = buildRulesFromFlags(getPresetFlags(), prefs)
  return saveAlertRules(rules)
}

module.exports = {
  getPresetFlags,
  setPresetFlags,
  getAlertRules,
  saveAlertRules,
  syncRulesFromPrefs,
  buildRulesFromFlags,
}
