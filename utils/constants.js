/**
 * 四套国风主题（设计系统）
 * 参考：宋瓷天青/月白、唐红鎏金、国潮朱青撞色、文房朱砂竹木
 */
const THEMES = {
  songyun: {
    key: 'songyun',
    name: '宋韵雅致',
    tagline: '汝窑天青 · 月白留白',
    bg: '#EEEAE3',
    text: '#2C2A27',
    accent: '#5F8F7A',
    muted: '#8F877C',
    card: '#F8F5EF',
    border: '#C9C0B0',
    progress: ['#C9C0B0', '#5F8F7A'],
    clockFace: '#F8F5EF',
    decor: '#A8BFAF',
    gilding: '#B7A078',
    outerRing: '#7A9A88',
    btnStyle: 'outline',
    radius: '8rpx',
  },
  tangfeng: {
    key: 'tangfeng',
    name: '唐风华丽',
    tagline: '朱红鎏金 · 绢帛华彩',
    // 底：暖绢；字：深檀；点睛：朱红；金只做边框装饰，不写大段字
    bg: '#F6EBDA',
    text: '#3B2414',
    accent: '#B83228',
    muted: '#6E5646',
    card: '#FFF8EC',
    border: '#B8953C',
    progress: ['#C9A24A', '#B83228'],
    clockFace: '#FFF9EF',
    decor: '#B8953C',
    gilding: '#A67C20',
    outerRing: '#B83228',
    btnStyle: 'gilded',
    radius: '12rpx',
  },
  guochao: {
    key: 'guochao',
    name: '新中式国潮',
    tagline: '朱砂印青 · 现代解构',
    bg: '#EFE9DE',
    text: '#141414',
    accent: '#C8102E',
    muted: '#6E6760',
    card: '#FFFcf7',
    border: '#D9D0C2',
    progress: ['#D9D0C2', '#C8102E'],
    clockFace: '#FFFFFF',
    decor: '#1F4E79',
    gilding: '#C8102E',
    outerRing: '#1F4E79',
    btnStyle: 'solid',
    radius: '4rpx',
  },
  wenfang: {
    key: 'wenfang',
    name: '文房书斋',
    tagline: '朱砂印泥 · 竹木书卷',
    bg: '#EBE3D2',
    text: '#2A2118',
    accent: '#A33B2B',
    muted: '#7E7264',
    card: '#F7F1E4',
    border: '#C4B394',
    progress: ['#C4B394', '#A33B2B'],
    clockFace: '#F7F1E4',
    decor: '#5C4A38',
    gilding: '#A33B2B',
    outerRing: '#5C4A38',
    btnStyle: 'seal',
    radius: '6rpx',
  },
  // 护眼暗色（不在主题选择器中展示）
  moyun: {
    key: 'moyun',
    name: '暗夜墨韵',
    tagline: '护眼夜读',
    bg: '#161616',
    text: '#D8CEB4',
    accent: '#C9A96E',
    muted: '#8A8068',
    card: '#22201C',
    border: '#4A3F32',
    progress: ['#4A3F32', '#C9A96E'],
    clockFace: '#22201C',
    decor: '#4A3F32',
    gilding: '#C9A96E',
    outerRing: '#C9A96E',
    btnStyle: 'gilded',
    radius: '10rpx',
  },
}

/** 旧版主题键迁移 */
const THEME_ALIAS = {
  zhixuan: 'songyun',
  shanshui: 'wenfang',
  '宣纸白': 'songyun',
  '水墨山': 'wenfang',
  '暗夜墨': 'moyun',
}

const THEME_LIST = ['songyun', 'tangfeng', 'guochao', 'wenfang'].map((key) => ({
  key,
  name: THEMES[key].name,
  tagline: THEMES[key].tagline,
  bg: THEMES[key].bg,
  text: THEMES[key].text,
  accent: THEMES[key].accent,
  border: THEMES[key].border,
  card: THEMES[key].card,
  decor: THEMES[key].decor,
  gilding: THEMES[key].gilding,
}))

const DIAL_MODES = {
  SHICHEN_ONLY: 'shichen-only',
  NUMBER_ONLY: 'number-only',
  SHICHEN_NUMBER: 'shichen-number',
}

const DIAL_MODE_OPTIONS = [
  { value: 'shichen-only', label: '十二时辰（古风极致）' },
  { value: 'shichen-number', label: '时辰 + 四正位数字（推荐）' },
  { value: 'number-only', label: '纯数字（现代简洁）' },
]

const SHICHEN_CHARS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const EXAM_TEMPLATES = [
  { id: 'ky-zz', name: '考研政治', start: '08:30', end: '11:30', icon: '研' },
  { id: 'ky-yy', name: '考研英语', start: '14:00', end: '17:00', icon: '研' },
  { id: 'cet4', name: '四级笔试', start: '09:00', end: '11:20', icon: '级' },
  { id: 'cet6', name: '六级笔试', start: '15:00', end: '17:25', icon: '级' },
  { id: 'gk-xc', name: '公考行测', start: '09:00', end: '11:00', icon: '公' },
  { id: 'gk-sl', name: '公考申论', start: '14:00', end: '16:30', icon: '公' },
  { id: 'js-zs', name: '教资综素', start: '09:00', end: '11:00', icon: '教' },
  { id: 'g120', name: '通用120min', start: '09:00', end: '11:00', icon: '通' },
  { id: 'g150', name: '通用150min', start: '09:00', end: '11:30', icon: '通' },
  { id: 'g180', name: '通用180min', start: '09:00', end: '12:00', icon: '通' },
]

const PRESET_ALERTS = [
  { key: 'alert_30', minutes: 30, name: '剩余30分钟提醒' },
  { key: 'alert_15', minutes: 15, name: '剩余15分钟提醒' },
  { key: 'alert_5', minutes: 5, name: '剩余5分钟提醒' },
  { key: 'alert_1', minutes: 1, name: '剩余1分钟提醒' },
]

const SOUND_OPTIONS = [
  { key: 'bell-copper', label: '铜铃轻响' },
  { key: 'page-flip', label: '书页翻动' },
  { key: 'guqin-soft', label: '古琴淡韵' },
]

const NOISE_OPTIONS = [
  { key: 'rain-window', label: '细雨书窗' },
  { key: 'mountain-breeze', label: '山林微风' },
  { key: 'guqin-soft', label: '古琴轻奏' },
  { key: 'empty-room', label: '空室静籁' },
]

const DEFAULT_USER_PREFS = {
  clockMode: 'digital',
  dialMode: 'shichen-number',
  theme: 'songyun',
  soundEnabled: true,
  examEndSoundEnabled: true,
  vibrateEnabled: true,
  keepScreenOn: true,
  speedRatio: 1.0,
  noiseVolume: 0.6,
  noiseKey: 'rain-window',
  noisePlaying: false,
  alertSound: 'bell-copper',
  alertPopup: true,
  alertVibrate: true,
  alertSoundOn: false,
}

const DEFAULT_EXAM_CONFIG = {
  virtualStartTime: '09:00',
  virtualEndTime: '11:30',
  templateId: 'g150',
  subjectName: '通用150min',
}

const DEFAULT_PRESET_FLAGS = {
  alert_30: true,
  alert_15: true,
  alert_5: true,
  alert_1: false,
}

const STATUS_LABELS = {
  IDLE: '待考',
  RUNNING: '进行中',
  PAUSED: '已暂停',
  FINISHED: '已结束',
}

const TICK_INTERVAL_MS = 1000
const APP_VERSION = '1.1.7'

module.exports = {
  THEMES,
  THEME_ALIAS,
  THEME_LIST,
  DIAL_MODES,
  DIAL_MODE_OPTIONS,
  SHICHEN_CHARS,
  EXAM_TEMPLATES,
  PRESET_ALERTS,
  SOUND_OPTIONS,
  NOISE_OPTIONS,
  DEFAULT_USER_PREFS,
  DEFAULT_EXAM_CONFIG,
  DEFAULT_PRESET_FLAGS,
  STATUS_LABELS,
  TICK_INTERVAL_MS,
  APP_VERSION,
}
