Component({
  properties: {
    template: { type: Object, value: {} },
    selected: { type: Boolean, value: false },
  },
  methods: {
    onTap() {
      this.triggerEvent('select', { template: this.data.template })
    },
  },
})
