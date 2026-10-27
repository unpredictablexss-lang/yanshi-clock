Component({
  properties: {
    noiseOptions: { type: Array, value: [] },
    currentNoise: { type: String, value: 'rain-window' },
    volume: { type: Number, value: 0.6 },
    playing: { type: Boolean, value: false },
  },
  data: {
    currentLabel: '细雨书窗',
  },
  observers: {
    'currentNoise, noiseOptions'(key, options) {
      const hit = (options || []).find((n) => n.key === key)
      this.setData({ currentLabel: hit ? hit.label : key })
    },
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { key: e.currentTarget.dataset.key })
    },
    onToggle() {
      this.triggerEvent('toggle')
    },
    onVolume(e) {
      this.triggerEvent('volumechange', { value: e.detail.value / 100 })
    },
  },
})
