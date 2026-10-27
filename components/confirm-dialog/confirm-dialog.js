Component({
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: '确认' },
    message: { type: String, value: '' },
    confirmText: { type: String, value: '确认' },
    cancelText: { type: String, value: '取消' },
  },
  methods: {
    onMask() {},
    onCancel() {
      this.triggerEvent('cancel')
    },
    onConfirm() {
      this.triggerEvent('confirm')
    },
  },
})
