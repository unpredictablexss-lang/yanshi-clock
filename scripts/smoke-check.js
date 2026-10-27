const memoryStorage = new Map()

global.wx = {
  getStorageSync: (key) => memoryStorage.has(key) ? memoryStorage.get(key) : '',
  setStorageSync: (key, value) => memoryStorage.set(key, value),
  removeStorageSync: (key) => memoryStorage.delete(key),
  getStorageInfoSync: () => ({ keys: Array.from(memoryStorage.keys()) }),
  createInnerAudioContext: () => ({
    play() {}, stop() {}, destroy() {},
    onPlay() {}, onPause() {}, onStop() {}, onError() {},
    volume: 1,
  }),
}

const path = require('path')
const root = path.join(__dirname, '..')
const mods = [
  'utils/constants.js',
  'utils/time-utils.js',
  'utils/validators.js',
  'store/storage.js',
  'store/exam-config.js',
  'store/user-prefs.js',
  'store/alert-rules.js',
  'engine/timer-engine.js',
  'engine/alert-engine.js',
  'engine/audio-engine.js',
  'engine/canvas-renderer.js',
]

let fail = 0
for (const m of mods) {
  try {
    require(path.join(root, m))
    console.log('OK', m)
  } catch (e) {
    fail++
    console.log('FAIL', m, e.message)
  }
}

const timer = require(path.join(root, 'engine/timer-engine.js'))
const { createAlertEngine } = require(path.join(root, 'engine/alert-engine.js'))
const { validateExamTime } = require(path.join(root, 'utils/validators.js'))
const fs = require('fs')
const state = timer.createInitialState()
timer.configure(state, { virtualStartTime: '09:00', virtualEndTime: '09:01', subjectName: '测' }, { speedRatio: 1 })
timer.start(state)
state.realStartStamp = Date.now() - 2000
timer.calcCurrentVirtualTime(state)
console.log('timer', state.status, 'elapsed', state.elapsedMs)
console.log('validate bad', validateExamTime('11:00', '09:00'))

// 进度持久化：模拟小程序进程被系统回收后重启。
timer.persistSession(state)
const restoredState = timer.createInitialState()
if (!timer.restoreSession(restoredState) || restoredState.status !== 'RUNNING' || restoredState.elapsedMs < 1500) {
  fail++
  console.log('FAIL timer session restore')
} else {
  console.log('OK timer session restore')
}
timer.pause(restoredState)
const restoredPaused = timer.createInitialState()
if (!timer.restoreSession(restoredPaused) || restoredPaused.status !== 'PAUSED') {
  fail++
  console.log('FAIL paused session restore')
} else {
  console.log('OK paused session restore')
}
timer.reset(restoredPaused)
if (memoryStorage.has('yskc_timer_session')) {
  fail++
  console.log('FAIL reset clears session')
} else {
  console.log('OK reset clears session')
}

const completedState = timer.createInitialState()
timer.configure(completedState, { virtualStartTime: '09:00', virtualEndTime: '09:01', subjectName: '去重测试' }, { speedRatio: 1 })
timer.start(completedState)
timer.recordExamStats(completedState)
timer.recordExamStats(completedState)
if (timer.getStudyStats().totalExamCount !== 1) {
  fail++
  console.log('FAIL study stats dedup')
} else {
  console.log('OK study stats dedup')
}

const alertEngine = createAlertEngine()
alertEngine.setRules([
  { id: 'alert_30', thresholdMinutes: 30, enabled: true, triggered: false },
  { id: 'alert_15', thresholdMinutes: 15, enabled: true, triggered: false },
  { id: 'alert_1', thresholdMinutes: 1, enabled: true, triggered: false },
])

// 穿越：61s → 58s 应触发 1 分钟提醒
alertEngine.check({ status: 'RUNNING', remainingMs: 61000 })
const crossed = alertEngine.check({ status: 'RUNNING', remainingMs: 58000 })
if (!crossed || crossed.id !== 'alert_1') {
  fail++
  console.log('FAIL alert cross-window', crossed && crossed.id)
} else {
  console.log('OK alert cross-window')
}

// 短考试：全程低于 30/15 分钟阈值，不应误触
alertEngine.resetTriggers()
alertEngine.setRules([
  { id: 'alert_30', thresholdMinutes: 30, enabled: true, triggered: false },
  { id: 'alert_15', thresholdMinutes: 15, enabled: true, triggered: false },
])
const first = alertEngine.check({ status: 'RUNNING', remainingMs: 10 * 60 * 1000 })
const second = alertEngine.check({ status: 'RUNNING', remainingMs: 10 * 60 * 1000 - 1000 })
if (first || second) {
  fail++
  console.log('FAIL alert short-exam false positive', first && first.id, second && second.id)
} else {
  console.log('OK alert short-exam no false positive')
}

// 一次跨过多个阈值时只发当前最紧迫的提醒。
alertEngine.resetTriggers()
alertEngine.setRules([
  { id: 'alert_30', thresholdMinutes: 30, enabled: true, triggered: false },
  { id: 'alert_15', thresholdMinutes: 15, enabled: true, triggered: false },
  { id: 'alert_5', thresholdMinutes: 5, enabled: true, triggered: false },
])
alertEngine.setBaseline(31 * 60 * 1000)
const urgent = alertEngine.check({ status: 'RUNNING', remainingMs: 4 * 60 * 1000 })
const repeated = alertEngine.check({ status: 'RUNNING', remainingMs: 3.9 * 60 * 1000 })
if (!urgent || urgent.id !== 'alert_5' || repeated) {
  fail++
  console.log('FAIL alert multi-cross urgency')
} else {
  console.log('OK alert multi-cross urgency')
}

// 代码包中的音频必须齐全且具有有效 MP3 帧。
// 微信开发者工具会累计全部图片/音频，因此媒体总量必须小于 200KB。
const audioFiles = [
  'bell-copper.mp3', 'page-flip.mp3', 'guqin-soft.mp3',
  'rain-window.mp3', 'mountain-breeze.mp3', 'guqin-loop.mp3', 'empty-room.mp3',
]
audioFiles.forEach((name) => {
  const file = path.join(root, 'assets', 'audio', name)
  const buffer = fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0)
  const hasId3 = buffer.subarray(0, 3).toString('ascii') === 'ID3'
  const hasFrameSync = buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0
  if (!hasId3 && !hasFrameSync) {
    fail++
    console.log('FAIL audio asset', name, buffer.length + ' bytes')
  }
})
const mediaExtensions = new Set([
  '.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif', '.flac', '.m4a', '.ogg',
  '.ape', '.amr', '.wma', '.wav', '.mp3', '.mp4', '.aac', '.aiff', '.caf',
])
const mediaFiles = require('child_process').execFileSync('rg', ['--files', 'assets'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split(/\r?\n/)
  .filter((name) => mediaExtensions.has(path.extname(name).toLowerCase()))
const mediaBytes = mediaFiles.reduce((total, name) => total + fs.statSync(path.join(root, name)).size, 0)
if (mediaBytes >= 200 * 1024) {
  fail++
  console.log('FAIL media total', mediaBytes + ' bytes')
} else {
  console.log('OK audio assets and media total', mediaBytes + ' bytes')
}

// app.json 中声明的页面与组件入口均存在。
const appConfig = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'))
for (const page of appConfig.pages || []) {
  for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
    if (!fs.existsSync(path.join(root, page + ext))) {
      fail++
      console.log('FAIL missing page file', page + ext)
    }
  }
}
console.log('OK page routes')

for (const jsonFile of require('child_process').execFileSync('rg', ['--files', '-g', '*.json'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/)) {
  const config = JSON.parse(fs.readFileSync(path.join(root, jsonFile), 'utf8'))
  for (const componentPath of Object.values(config.usingComponents || {})) {
    const entry = path.join(root, componentPath.replace(/^\//, ''))
    for (const ext of ['.js', '.json', '.wxml', '.wxss']) {
      if (!fs.existsSync(entry + ext)) {
        fail++
        console.log('FAIL missing component file', componentPath + ext)
      }
    }
  }
}
console.log('OK component routes')

for (const wxmlFile of require('child_process').execFileSync('rg', ['--files', '-g', '*.wxml'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/)) {
  const jsFile = wxmlFile.replace(/\.wxml$/, '.js')
  const js = fs.existsSync(path.join(root, jsFile)) ? fs.readFileSync(path.join(root, jsFile), 'utf8') : ''
  const wxml = fs.readFileSync(path.join(root, wxmlFile), 'utf8')
  const handlers = Array.from(wxml.matchAll(/(?:bind|catch)(?::?[a-z-]+)="([A-Za-z_$][\w$]*)"/g), (match) => match[1])
  handlers.forEach((handler) => {
    if (!new RegExp(`\\b${handler}\\s*\\(`).test(js)) {
      fail++
      console.log('FAIL missing event handler', wxmlFile, handler)
    }
  })
}
console.log('OK WXML event handlers')

console.log('DONE fail=' + fail)
process.exitCode = fail > 0 ? 1 : 0
