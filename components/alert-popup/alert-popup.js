Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '' },
    message: { type: String, value: '' },
  },
  methods: {
    onDismiss() {
      this.triggerEvent('dismiss')
    },
  },
})
