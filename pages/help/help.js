const { APP_VERSION } = require('../../utils/constants')
const { getUserPrefs } = require('../../store/user-prefs')
const { buildThemeVars, themeClassName, normalizeThemeKey } = require('../../utils/theme')

Page({
  data: {
    themeClass: 'theme-songyun',
    themeVars: '',
    version: APP_VERSION,
    faqs: [
      {
        q: '如何设置考试时间？',
        a: '在时钟页点击「考试设置」或底部「设置时段」，选择时间或快速模板，再填写考试名（12字以内）。保存后会立即应用到主页。',
        open: true,
      },
      {
        q: '电子钟与挂钟如何切换？',
        a: '在时钟页底部点击「切换挂钟 / 切换电子钟」。表盘风格可在设置页调整。',
        open: false,
      },
      {
        q: '如何配置提醒？',
        a: '进入提醒设置页，开启剩余30/15/5/1分钟提醒，并选择弹窗、震动或音效。考试结束铃声可在设置页单独开关。',
        open: false,
      },
      {
        q: '如何使用投屏全屏模式？',
        a: '在时钟页点击「全屏」，界面将隐藏操作区和底部导航，仅保留时钟；再次点击「退出全屏」恢复。',
        open: false,
      },
      {
        q: '白噪音会上传我的数据吗？',
        a: '不会。环境音文件已打包在小程序中，播放不需要登录、服务器或网络请求。',
        open: false,
      },
    ],
    feedback: '',
    contact: '',
  },

  onShow() {
    const prefs = getUserPrefs()
    const themeKey = normalizeThemeKey(prefs.theme)
    this.setData({
      themeClass: themeClassName(themeKey),
      themeVars: buildThemeVars(themeKey),
    })
  },

  onToggle(e) {
    const idx = e.currentTarget.dataset.index
    const key = `faqs[${idx}].open`
    this.setData({ [key]: !this.data.faqs[idx].open })
  },

  onInputFeedback(e) {
    this.setData({ feedback: e.detail.value })
  },

  onInputContact(e) {
    this.setData({ contact: e.detail.value })
  },

  onSubmit() {
    if (!this.data.feedback.trim()) {
      wx.showToast({ title: '请先填写建议', icon: 'none' })
      return
    }
    // 个人主体可用客服会话；此处先本地提示，正式可接 button open-type="contact"
    wx.setClipboardData({
      data: `【砚时考钟反馈】\n${this.data.feedback}\n联系方式：${this.data.contact || '未填'}`,
      success: () => {
        wx.showModal({
          title: '反馈已复制',
          content: '内容已复制到剪贴板。也可在小程序后台开启客服消息后使用「联系客服」按钮发送。',
          showCancel: false,
        })
        this.setData({ feedback: '', contact: '' })
      },
    })
  },
})
