const { THEMES, THEME_ALIAS } = require('./constants')

function normalizeThemeKey(key) {
  if (!key) return 'songyun'
  if (THEMES[key]) return key
  if (THEME_ALIAS[key]) return THEME_ALIAS[key]
  return 'songyun'
}

function getTheme(key) {
  return THEMES[normalizeThemeKey(key)]
}

/** 生成可内联到页面根节点的 CSS 变量，穿透组件样式隔离 */
function buildThemeVars(key) {
  const t = getTheme(key)
  return [
    `--yskc-bg:${t.bg}`,
    `--yskc-text:${t.text}`,
    `--yskc-accent:${t.accent}`,
    `--yskc-muted:${t.muted}`,
    `--yskc-card:${t.card}`,
    `--yskc-border:${t.border}`,
    `--yskc-decor:${t.decor}`,
    `--yskc-gilding:${t.gilding}`,
    `--yskc-outer:${t.outerRing || t.accent}`,
    `--yskc-progress-a:${t.progress[0]}`,
    `--yskc-progress-b:${t.progress[1]}`,
    `--yskc-face:${t.clockFace}`,
    `--yskc-radius:${t.radius || '12rpx'}`,
  ].join(';')
}

function themeClassName(key) {
  return `theme-${normalizeThemeKey(key)}`
}

module.exports = {
  normalizeThemeKey,
  getTheme,
  buildThemeVars,
  themeClassName,
}
