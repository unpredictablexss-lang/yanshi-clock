function createAlertEngine() {
  return {
    rules: [],
    onFire: null,
    _lastRemainingMs: null,

    setRules(rules) {
      this.rules = (rules || []).map((r) => ({ ...r, triggered: !!r.triggered }))
    },

    resetTriggers() {
      this.rules.forEach((r) => {
        r.triggered = false
      })
      this._lastRemainingMs = null
    },

    setBaseline(remainingMs) {
      const value = Number(remainingMs)
      this._lastRemainingMs = Number.isFinite(value) ? Math.max(0, value) : null
    },

    /**
     * 从上方向下穿越阈值时才触发（prev > threshold && remaining <= threshold）。
     * 首个样本只建立基线，不触发，避免短考试立刻误触更大阈值的提醒。
     * 同 tick 越过多个阈值时，标记所有已越过规则，仅发出当前最紧迫的一条。
     */
    check(timerState) {
      if (!timerState || timerState.status !== 'RUNNING') return null
      const remainingMs = Math.max(0, timerState.remainingMs || 0)
      const prev = this._lastRemainingMs

      if (prev == null) {
        this._lastRemainingMs = remainingMs
        return null
      }

      const crossed = []
      for (let i = 0; i < this.rules.length; i++) {
        const rule = this.rules[i]
        if (!rule.enabled || rule.triggered) continue
        const thresholdMs = (rule.thresholdMinutes || 0) * 60 * 1000
        if (prev > thresholdMs && remainingMs <= thresholdMs) {
          rule.triggered = true
          crossed.push(rule)
        }
      }

      // 长时间切到后台可能一次跨过多个阈值，只提示当前最紧迫的一条。
      const fired = crossed.length
        ? crossed.reduce((urgent, rule) => (
          rule.thresholdMinutes < urgent.thresholdMinutes ? rule : urgent
        ))
        : null
      if (fired && typeof this.onFire === 'function') {
        this.onFire(fired)
      }

      this._lastRemainingMs = remainingMs

      return fired
    },
  }
}

module.exports = {
  createAlertEngine,
}
