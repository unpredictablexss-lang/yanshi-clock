const storage = require('./storage')
const { DEFAULT_USER_PREFS } = require('../utils/constants')
const { normalizeThemeKey } = require('../utils/theme')

const KEY = 'user_prefs'

function getUserPrefs() {
  const raw = { ...DEFAULT_USER_PREFS, ...(storage.get(KEY) || {}) }
  raw.theme = normalizeThemeKey(raw.theme)
  return raw
}

function setUserPrefs(prefs) {
  const next = { ...DEFAULT_USER_PREFS, ...getUserPrefs(), ...prefs }
  next.theme = normalizeThemeKey(next.theme)
  storage.set(KEY, next)
  return next
}

module.exports = {
  getUserPrefs,
  setUserPrefs,
}
