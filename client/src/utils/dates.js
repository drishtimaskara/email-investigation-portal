// All email dates are shown in IST, whatever timezone the player's computer uses.
const TZ = 'Asia/Kolkata'

const dayKey = (d) => d.toLocaleDateString('en-CA', { timeZone: TZ }) // e.g. 2026-10-13

export function formatListDate(iso) {
  const d = new Date(iso)
  const now = new Date()
  if (dayKey(d) === dayKey(now)) {
    return d.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
  }
  const opts = { timeZone: TZ, month: 'short', day: 'numeric' }
  if (dayKey(d).slice(0, 4) !== dayKey(now).slice(0, 4)) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

export function formatFullDate(iso) {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })
  return `${date}, ${time} IST`
}
