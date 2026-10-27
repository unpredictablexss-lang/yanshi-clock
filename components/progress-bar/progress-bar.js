Component({
  properties: {
    progress: { type: Number, value: 0 },
  },
  observers: {
    progress(val) {
      const p = Math.max(0, Math.min(1, Number(val) || 0))
      this.setData({
        percent: Math.round(p * 100),
        width: `${(p * 100).toFixed(1)}%`,
      })
    },
  },
  data: {
    percent: 0,
    width: '0%',
  },
})
