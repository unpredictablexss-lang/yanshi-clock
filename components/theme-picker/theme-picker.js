const { THEME_LIST } = require('../../utils/constants')

Component({
  properties: {
    current: { type: String, value: 'songyun' },
  },
  data: {
    themes: THEME_LIST,
  },
  methods: {
    onSelect(e) {
      this.triggerEvent('select', { theme: e.currentTarget.dataset.key })
    },
  },
})
