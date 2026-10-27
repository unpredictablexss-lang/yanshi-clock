const { renderClock } = require('../../engine/canvas-renderer')
const { normalizeThemeKey } = require('../../utils/theme')

Component({
  properties: {
    virtualTime: { type: null, value: null },
    themeKey: { type: String, value: 'songyun' },
    dialMode: { type: String, value: 'shichen-number' },
  },
  data: {
    canvasSize: 300,
  },
  lifetimes: {
    ready() {
      this._alive = true
      this._initWithRetry(0)
    },
    detached() {
      this._alive = false
      this._canvas = null
      this._ctx = null
      this._size = 0
    },
  },
  observers: {
    'virtualTime, themeKey, dialMode'() {
      this._draw()
    },
  },
  methods: {
    _initWithRetry(attempt) {
      if (!this._alive) return
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      const size = Math.floor(Math.min((win.windowWidth || 375) * 0.88, 340))
      this.setData({ canvasSize: size }, () => {
        setTimeout(() => this._initCanvas(attempt), 40 + attempt * 60)
      })
    },

    _initCanvas(attempt) {
      if (!this._alive) return
      const query = this.createSelectorQuery()
      query.select('#analogCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (!this._alive) return
          const info = res && res[0]
          if (!info || !info.node) {
            if (attempt < 5) this._initWithRetry(attempt + 1)
            return
          }
          const canvas = info.node
          const width = info.width || this.data.canvasSize || 300
          if (width < 10) {
            if (attempt < 5) this._initWithRetry(attempt + 1)
            return
          }
          const dpr = (wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : wx.getSystemInfoSync().pixelRatio) || 1
          canvas.width = width * dpr
          canvas.height = width * dpr
          const ctx = canvas.getContext('2d')
          ctx.setTransform(1, 0, 0, 1, 0, 0)
          ctx.scale(dpr, dpr)
          this._canvas = canvas
          this._ctx = ctx
          this._size = width
          this._draw()
        })
    },

    _draw() {
      if (!this._ctx || !this._size) return
      try {
        const time = this.data.virtualTime
        renderClock(this._ctx, this._size, {
          themeKey: normalizeThemeKey(this.data.themeKey),
          dialMode: this.data.dialMode || 'shichen-number',
          virtualTime: time ? new Date(time) : new Date(),
        })
      } catch (err) {
        console.error('[analog-clock] render failed', err)
      }
    },
  },
})
