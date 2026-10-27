/**
 * 音频引擎：短音效 + 白噪音双通道
 * 内置音源使用压缩后的 MP3，避免单个音频资源超过代码质量建议的 200KB。
 * 除 CC0 雨声外，其余音源由 scripts/generate-audio.js 程序化生成。
 */
const SOUND_SRC = {
  'bell-copper': '/assets/audio/bell-copper.mp3',
  'page-flip': '/assets/audio/page-flip.mp3',
  'guqin-soft': '/assets/audio/guqin-soft.mp3',
}

const NOISE_SRC = {
  'rain-window': '/assets/audio/rain-window.mp3',
  'mountain-breeze': '/assets/audio/mountain-breeze.mp3',
  'guqin-soft': '/assets/audio/guqin-loop.mp3',
  'empty-room': '/assets/audio/empty-room.mp3',
}

function createAudioEngine() {
  const engine = {
    soundEnabled: true,
    noiseEnabled: true,
    noiseVolume: 0.6,
    effectCtx: null,
    noiseCtx: null,
    currentNoiseKey: null,
    noisePlaying: false,
    noiseListener: null,

    _ensureEffect() {
      if (this.effectCtx) return this.effectCtx
      this.effectCtx = wx.createInnerAudioContext()
      this.effectCtx.obeyMuteSwitch = false
      return this.effectCtx
    },

    _ensureNoise() {
      if (this.noiseCtx) return this.noiseCtx
      this.noiseCtx = wx.createInnerAudioContext()
      this.noiseCtx.loop = true
      this.noiseCtx.obeyMuteSwitch = false
      this.noiseCtx.volume = this.noiseVolume
      this.noiseCtx.onPlay(() => {
        this.noisePlaying = true
        this._notifyNoise()
      })
      this.noiseCtx.onPause(() => {
        this.noisePlaying = false
        this._notifyNoise()
      })
      this.noiseCtx.onStop(() => {
        this.noisePlaying = false
        this._notifyNoise()
      })
      this.noiseCtx.onError((error) => {
        this.noisePlaying = false
        this._notifyNoise(error || { errMsg: '音频播放失败' })
      })
      return this.noiseCtx
    },

    _notifyNoise(error) {
      if (typeof this.noiseListener === 'function') {
        this.noiseListener({
          playing: this.noisePlaying,
          key: this.currentNoiseKey,
          error: error || null,
        })
      }
    },

    setNoiseListener(listener) {
      this.noiseListener = typeof listener === 'function' ? listener : null
    },

    setSoundEnabled(bool) {
      this.soundEnabled = !!bool
      if (!this.soundEnabled) this.stopEffect()
    },

    setNoiseEnabled(bool) {
      this.noiseEnabled = !!bool
      if (!this.noiseEnabled) this.stopNoise()
    },

    setNoiseVolume(v) {
      this.noiseVolume = Math.max(0, Math.min(1, Number(v) || 0))
      if (this.noiseCtx) this.noiseCtx.volume = this.noiseVolume
    },

    playEffect(soundKey) {
      if (!this.soundEnabled) return false
      const src = SOUND_SRC[soundKey]
      if (!src) return false
      try {
        const ctx = this._ensureEffect()
        ctx.stop()
        ctx.src = src
        ctx.play()
        return true
      } catch (e) {
        console.warn('playEffect failed', e)
        return false
      }
    },

    stopEffect() {
      if (this.effectCtx) {
        try { this.effectCtx.stop() } catch (e) { /* ignore */ }
      }
    },

    startNoise(noiseKey) {
      if (!this.noiseEnabled) return false
      const src = NOISE_SRC[noiseKey]
      if (!src) return false
      try {
        const ctx = this._ensureNoise()
        this.currentNoiseKey = noiseKey
        ctx.src = src
        ctx.volume = this.noiseVolume
        ctx.play()
        this.noisePlaying = true
        this._notifyNoise()
        return true
      } catch (e) {
        this.noisePlaying = false
        this._notifyNoise(e)
        console.warn('startNoise failed', e)
        return false
      }
    },

    stopNoise() {
      if (this.noiseCtx) {
        try { this.noiseCtx.stop() } catch (e) { /* ignore */ }
      }
      this.currentNoiseKey = null
      this.noisePlaying = false
      this._notifyNoise()
    },

    isNoisePlaying() {
      return !!this.noisePlaying
    },

    destroy() {
      this.stopEffect()
      this.stopNoise()
      if (this.effectCtx) {
        try { this.effectCtx.destroy() } catch (e) { /* ignore */ }
        this.effectCtx = null
      }
      if (this.noiseCtx) {
        try { this.noiseCtx.destroy() } catch (e) { /* ignore */ }
        this.noiseCtx = null
      }
      this.noiseListener = null
    },
  }
  return engine
}

module.exports = {
  createAudioEngine,
  SOUND_SRC,
  NOISE_SRC,
}
