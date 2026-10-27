const { SHICHEN_CHARS, THEMES } = require('../utils/constants')
const { normalizeThemeKey } = require('../utils/theme')

const FOUR_MAIN_INDEX = [0, 3]  // 六合对宫中 子午(顶)、卯酉(底) 为四正

function getThemeColors(themeKey) {
  return THEMES[normalizeThemeKey(themeKey)] || THEMES.songyun
}

/* ================================================================
   表盘主体 — 多层仿木/漆器贝塞尔边框，取代扁平颜色圈
   ================================================================ */

function drawBackground(ctx, size, themeKey) {
  const theme = getThemeColors(themeKey)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42
  const dpr = 1

  ctx.clearRect(0, 0, size, size)

  /* ── 外圈投影层（软阴影，模拟钟体厚度） ── */
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + size * 0.042, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(44, 36, 24, 0.10)'
  ctx.fill()
  ctx.restore()

  /* ── 最外细线（仿木框外侧轮廓） ── */
  ctx.beginPath()
  ctx.arc(cx, cy, r + size * 0.036, 0, Math.PI * 2)
  ctx.strokeStyle = theme.border
  ctx.lineWidth = Math.max(1.5, size * 0.006)
  ctx.globalAlpha = 0.55
  ctx.stroke()
  ctx.globalAlpha = 1

  /* ── 主体边框（仿木/漆器宽框，渐变替代扁平色） ── */
  const bezelOuter = r + size * 0.032
  const bezelInner = r + size * 0.006

  // 创建径向渐变模拟木框光泽
  const bezelGrad = ctx.createRadialGradient(cx, cy, bezelInner, cx, cy, bezelOuter)
  const faceColor = theme.clockFace  // 表盘底色
  bezelGrad.addColorStop(0, faceColor)
  bezelGrad.addColorStop(0.25, theme.border)
  bezelGrad.addColorStop(0.55, theme.muted)
  bezelGrad.addColorStop(0.75, theme.border)
  bezelGrad.addColorStop(1, 'rgba(44, 36, 24, 0.25)')

  ctx.beginPath()
  ctx.arc(cx, cy, bezelOuter, 0, Math.PI * 2)
  ctx.arc(cx, cy, bezelInner, 0, Math.PI * 2, true)
  ctx.fillStyle = bezelGrad
  ctx.fill()

  /* ── 边框内侧高光线（模拟光反射） ── */
  ctx.beginPath()
  ctx.arc(cx, cy, bezelInner, 0, Math.PI * 2)
  ctx.strokeStyle = theme.gilding
  ctx.lineWidth = Math.max(1, size * 0.004)
  ctx.globalAlpha = 0.45
  ctx.stroke()
  ctx.globalAlpha = 1

  /* ── 边框外侧暗线（加强立体感） ── */
  ctx.beginPath()
  ctx.arc(cx, cy, bezelOuter, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(44, 36, 24, 0.22)'
  ctx.lineWidth = Math.max(1, size * 0.003)
  ctx.stroke()

  /* ── 表盘面（微凹的纸/绢质感） ── */
  const faceGrad = ctx.createRadialGradient(cx - r * 0.15, cy - r * 0.2, r * 0.1, cx, cy, r * 0.94)
  faceGrad.addColorStop(0, theme.clockFace)
  faceGrad.addColorStop(0.65, theme.clockFace)
  faceGrad.addColorStop(0.9, adjustColor(theme.clockFace, -4))
  faceGrad.addColorStop(1, adjustColor(theme.clockFace, -8))

  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2)
  ctx.fillStyle = faceGrad
  ctx.fill()

  /* ── 表盘内圈细线 ── */
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2)
  ctx.strokeStyle = theme.border
  ctx.lineWidth = Math.max(1, size * 0.003)
  ctx.globalAlpha = 0.3
  ctx.stroke()
  ctx.globalAlpha = 1
}

/* 调整颜色明度（浅改暗，用于渐变） */
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (num & 255) + amount))
  return `rgb(${r},${g},${b})`
}

/* ================================================================
   装饰系统 — 每套主题的独有外环装饰（四正位墨点/纹样）
   ================================================================ */

function drawDecorRing(ctx, size, themeKey) {
  const theme = getThemeColors(themeKey)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42

  switch (themeKey) {
    case 'songyun':
      drawSongyunDecor(ctx, size, cx, cy, r, theme)
      break
    case 'tangfeng':
      drawTangfengDecor(ctx, size, cx, cy, r, theme)
      break
    case 'guochao':
      drawGuochaoDecor(ctx, size, cx, cy, r, theme)
      break
    case 'wenfang':
      drawWenfangDecor(ctx, size, cx, cy, r, theme)
      break
    case 'moyun':
      drawMoyunDecor(ctx, size, cx, cy, r, theme)
      break
    default:
      break
  }
}

/* 宋韵：四正位淡青圆墨点 + 八分位缃色小点 */
function drawSongyunDecor(ctx, size, cx, cy, r, theme) {
  const ringR = r + size * 0.038
  ctx.save()

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    const px = cx + ringR * Math.cos(angle)
    const py = cy + ringR * Math.sin(angle)

    ctx.beginPath()
    if (i % 3 === 0) {
      // 四正位：缃色圆墨点
      ctx.arc(px, py, Math.max(2, size * 0.008), 0, Math.PI * 2)
      ctx.fillStyle = theme.gilding
      ctx.globalAlpha = 0.5
    } else {
      // 其余位：淡青极小点
      ctx.arc(px, py, Math.max(0.8, size * 0.003), 0, Math.PI * 2)
      ctx.fillStyle = theme.accent
      ctx.globalAlpha = 0.2
    }
    ctx.fill()
  }

  ctx.restore()
}

/* 唐风：四正位菱形小金石 + 其余圆金点 */
function drawTangfengDecor(ctx, size, cx, cy, r, theme) {
  const ringR = r + size * 0.039
  ctx.save()

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    const px = cx + ringR * Math.cos(angle)
    const py = cy + ringR * Math.sin(angle)

    if (i % 3 === 0) {
      // 四正位：菱形鎏金石
      const ds = Math.max(3.5, size * 0.013)
      ctx.beginPath()
      ctx.moveTo(px, py - ds)
      ctx.lineTo(px + ds, py)
      ctx.lineTo(px, py + ds)
      ctx.lineTo(px - ds, py)
      ctx.closePath()
      ctx.fillStyle = theme.gilding
      ctx.globalAlpha = 0.7
      ctx.fill()
    } else {
      ctx.beginPath()
      ctx.arc(px, py, Math.max(1.4, size * 0.005), 0, Math.PI * 2)
      ctx.fillStyle = theme.gilding
      ctx.globalAlpha = 0.35
      ctx.fill()
    }
  }

  ctx.restore()
}

/* 国潮：四正位方点 + 其余圆点，朱青撞色 */
function drawGuochaoDecor(ctx, size, cx, cy, r, theme) {
  const ringR = r + size * 0.037
  ctx.save()

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    const px = cx + ringR * Math.cos(angle)
    const py = cy + ringR * Math.sin(angle)

    if (i % 3 === 0) {
      const hs = Math.max(2, size * 0.008)
      ctx.fillStyle = theme.decor
      ctx.globalAlpha = 0.5
      ctx.fillRect(px - hs, py - hs, hs * 2, hs * 2)
    } else {
      ctx.beginPath()
      ctx.arc(px, py, Math.max(1, size * 0.004), 0, Math.PI * 2)
      ctx.fillStyle = theme.accent
      ctx.globalAlpha = 0.3
      ctx.fill()
    }
  }

  ctx.restore()
}

/* 文房书斋：竹节分段弧线 + 四正位小印 */
function drawWenfangDecor(ctx, size, cx, cy, r, theme) {
  const outerR = r + size * 0.039
  ctx.save()
  ctx.strokeStyle = theme.decor
  ctx.lineWidth = Math.max(1.8, size * 0.007)
  ctx.globalAlpha = 0.35

  const segCount = 24
  const segArc = (Math.PI * 2) / segCount
  const gapRatio = 0.12

  for (let i = 0; i < segCount; i++) {
    const startAngle = i * segArc + segArc * gapRatio / 2
    const endAngle = (i + 1) * segArc - segArc * gapRatio / 2
    ctx.beginPath()
    ctx.arc(cx, cy, outerR, startAngle - Math.PI / 2, endAngle - Math.PI / 2)
    ctx.stroke()
  }

  // 四正位小印章方块
  ctx.globalAlpha = 0.45
  for (let i = 0; i < 4; i++) {
    const angle = (i * 90 - 90) * Math.PI / 180
    const px = cx + outerR * Math.cos(angle)
    const py = cy + outerR * Math.sin(angle)
    const ss = Math.max(3, size * 0.011)
    ctx.fillStyle = theme.gilding
    ctx.fillRect(px - ss, py - ss, ss * 2, ss * 2)
  }

  ctx.restore()
}

/* 暗夜墨韵：四正位金点 + 其余暗金细点 */
function drawMoyunDecor(ctx, size, cx, cy, r, theme) {
  const ringR = r + size * 0.037
  ctx.save()

  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    const px = cx + ringR * Math.cos(angle)
    const py = cy + ringR * Math.sin(angle)

    ctx.beginPath()
    if (i % 3 === 0) {
      ctx.arc(px, py, Math.max(1.8, size * 0.007), 0, Math.PI * 2)
      ctx.fillStyle = theme.gilding
      ctx.globalAlpha = 0.5
    } else {
      ctx.arc(px, py, Math.max(0.8, size * 0.003), 0, Math.PI * 2)
      ctx.fillStyle = theme.gilding
      ctx.globalAlpha = 0.18
    }
    ctx.fill()
  }

  ctx.restore()
}

/* ================================================================
   刻度系统
   ================================================================ */

function drawMinuteMarks(ctx, size, themeKey) {
  const theme = getThemeColors(themeKey)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42 * 0.94

  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 - 90) * Math.PI / 180
    const isMajor = i % 5 === 0
    const outer = r * (isMajor ? 0.94 : 0.96)
    const inner = r * (isMajor ? 0.82 : 0.9)

    ctx.beginPath()
    ctx.moveTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle))
    ctx.lineTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle))
    ctx.strokeStyle = isMajor ? theme.text : theme.muted
    ctx.lineWidth = isMajor ? Math.max(1.5, size * 0.005) : Math.max(0.6, size * 0.002)
    ctx.globalAlpha = isMajor ? 0.75 : 0.35
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/* ================================================================
   刻度文字 — 时辰六合对宫 / 12数字
   ================================================================ */

/* 时辰六合对宫：6个位置 × 2个时辰 = 12时辰，每格60° */
const SHICHEN_PAIRS = [
  ['子', '午'],  // 0° (12点) — 四正
  ['丑', '未'],  // 60° (2点)
  ['寅', '申'],  // 120° (4点)
  ['卯', '酉'],  // 180° (6点) — 四正
  ['辰', '戌'],  // 240° (8点)
  ['巳', '亥'],  // 300° (10点)
]

function draw12Shichen(ctx, size, colors) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42 * 0.73
  const fontSize = Math.floor(size * 0.06)
  const dotSize = Math.floor(size * 0.015)

  SHICHEN_PAIRS.forEach(([upper, lower], i) => {
    const angle = (i * 60 - 90) * Math.PI / 180
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    const isMain = FOUR_MAIN_INDEX.includes(i)

    // 微阴影
    ctx.fillStyle = 'rgba(44,36,24,0.07)'
    ctx.font = `bold ${fontSize}px "STKaiti", "KaiTi", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${upper}·${lower}`, x + 0.5, y + 0.5)

    // 主体文字
    ctx.fillStyle = isMain ? colors.four : colors.other
    ctx.font = `bold ${fontSize}px "STKaiti", "KaiTi", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${upper}·${lower}`, x, y)
  })
}

/* 纯数字模式不动 */
function draw12Numbers(ctx, size, color) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42 * 0.73
  const fontSize = Math.floor(size * 0.065)

  for (let i = 1; i <= 12; i++) {
    const angle = (i * 30 - 90) * Math.PI / 180
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)

    ctx.fillStyle = color
    ctx.font = `bold ${fontSize}px "Georgia", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(i), x, y)
  }
}

/* 数字：四正方位标准钟面数字 (12=顶, 3=右, 6=底, 9=左) */
function draw4KeyNumbers(ctx, size, color) {
  const cx = size / 2
  const cy = size / 2
  const radius = size * 0.42 * 0.54
  const fontSize = Math.floor(size * 0.045)
  const positions = [
    { text: '12', angle: 0 },
    { text: '3',  angle: 90 },
    { text: '6',  angle: 180 },
    { text: '9',  angle: 270 },
  ]

  positions.forEach(({ text, angle }) => {
    const rad = (angle - 90) * Math.PI / 180
    const x = cx + radius * Math.cos(rad)
    const y = cy + radius * Math.sin(rad)

    ctx.fillStyle = 'rgba(44,36,24,0.05)'
    ctx.font = `bold ${fontSize}px "Georgia", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, x + 0.5, y + 0.5)

    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  })
}

function drawDialMarks(ctx, size, dialMode, themeKey) {
  const theme = getThemeColors(themeKey)
  drawMinuteMarks(ctx, size, themeKey)

  if (dialMode === 'number-only') {
    draw12Numbers(ctx, size, theme.text)
  } else if (dialMode === 'shichen-only') {
    draw12Shichen(ctx, size, { four: theme.accent, other: theme.text })
  } else {
    draw12Shichen(ctx, size, { four: theme.accent, other: theme.text })
    draw4KeyNumbers(ctx, size, theme.gilding)
  }
}

/* ================================================================
   品牌文字 — 表盘内品牌印记
   ================================================================ */

function drawBrand(ctx, size, themeKey) {
  const theme = getThemeColors(themeKey)

  if (themeKey === 'wenfang') {
    // 书斋：印章风格
    const bx = size / 2
    const by = size / 2 + size * 0.17
    const bw = size * 0.17
    const bh = size * 0.072

    ctx.save()
    ctx.fillStyle = theme.gilding
    ctx.globalAlpha = 0.13
    ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh)
    ctx.strokeStyle = theme.gilding
    ctx.lineWidth = 1.3
    ctx.globalAlpha = 0.45
    ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh)
    ctx.globalAlpha = 0.65
    ctx.fillStyle = theme.gilding
    ctx.font = `bold ${Math.floor(size * 0.036)}px "STKaiti", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('砚时', bx, by)
    ctx.restore()
    return
  }

  if (themeKey === 'tangfeng') {
    ctx.fillStyle = theme.accent
    ctx.font = `bold ${Math.floor(size * 0.04)}px "STKaiti", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('砚时考钟', size / 2, size / 2 + size * 0.17)
    return
  }

  // 默认品牌文字
  ctx.fillStyle = theme.muted
  ctx.globalAlpha = 0.55
  ctx.font = `${Math.floor(size * 0.038)}px "STKaiti", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('砚时考钟', size / 2, size / 2 + size * 0.17)
  ctx.globalAlpha = 1
}

/* ================================================================
   指针系统 — 带阴影 + 中心帽高光
   ================================================================ */

function drawHand(ctx, cx, cy, angleDeg, length, color, width, offsetShadow) {
  const rad = (angleDeg - 90) * Math.PI / 180
  const tipX = cx + length * Math.cos(rad)
  const tipY = cy + length * Math.sin(rad)

  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()
  ctx.restore()
}

function drawHands(ctx, size, virtualTime, themeKey) {
  if (!virtualTime) return
  const theme = getThemeColors(themeKey)
  const d = virtualTime instanceof Date ? virtualTime : new Date(virtualTime)
  const h = d.getHours()
  const m = d.getMinutes()
  const s = d.getSeconds()
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.42

  const hourAngle = (h % 12) * 30 + m * 0.5
  const minuteAngle = m * 6
  const secondAngle = s * 6

  const shadowOffset = Math.max(0.6, size * 0.002)

  // 时针阴影 + 主体
  const hourWidth = Math.max(3.5, size * 0.013)
  drawHand(ctx, cx + shadowOffset, cy + shadowOffset, hourAngle, r * 0.44, 'rgba(44,36,24,0.12)', hourWidth)
  drawHand(ctx, cx, cy, hourAngle, r * 0.44, theme.accent, hourWidth)

  // 分针阴影 + 主体
  const minWidth = Math.max(2.2, size * 0.008)
  drawHand(ctx, cx + shadowOffset, cy + shadowOffset, minuteAngle, r * 0.62, 'rgba(44,36,24,0.10)', minWidth)
  drawHand(ctx, cx, cy, minuteAngle, r * 0.62, theme.text, minWidth)

  // 秒针（细红，无阴影保持轻盈）
  const secColor = themeKey === 'guochao' ? theme.decor : theme.gilding
  drawHand(ctx, cx, cy, secondAngle, r * 0.73, secColor, Math.max(1, size * 0.0035))

  /* ── 中心帽（带高光，增加立体感） ── */
  const capR = Math.max(4, size * 0.017)

  // 帽底阴影
  ctx.beginPath()
  ctx.arc(cx + 0.5, cy + 0.5, capR, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(44,36,24,0.15)'
  ctx.fill()

  // 帽主体
  ctx.beginPath()
  ctx.arc(cx, cy, capR, 0, Math.PI * 2)
  ctx.fillStyle = theme.accent
  ctx.fill()

  // 帽高光
  ctx.beginPath()
  ctx.arc(cx - capR * 0.25, cy - capR * 0.3, capR * 0.4, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fill()
}

/* ================================================================
   主渲染函数
   ================================================================ */

function renderClock(ctx, size, options) {
  const themeKey = normalizeThemeKey((options && options.themeKey) || 'songyun')
  const dialMode = (options && options.dialMode) || 'shichen-number'
  const virtualTime = options && options.virtualTime
  drawBackground(ctx, size, themeKey)
  drawDecorRing(ctx, size, themeKey)
  drawDialMarks(ctx, size, dialMode, themeKey)
  drawBrand(ctx, size, themeKey)
  drawHands(ctx, size, virtualTime, themeKey)
}

module.exports = {
  renderClock,
  drawBackground,
  drawDialMarks,
  drawHands,
}
