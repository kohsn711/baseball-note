// アプリ全体で日本時間 (JST = UTC+9) を基準に日付を扱う
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

export const toJstDate = (d: Date = new Date()): Date =>
  new Date(d.getTime() + JST_OFFSET_MS)

// 'YYYY-MM-DD' (JST)
export const formatJstDate = (d: Date = new Date()): string =>
  toJstDate(d).toISOString().slice(0, 10)

// JSTでの「今日」「年」「月(0-11)」「日」を返す
export const getJstParts = (d: Date = new Date()) => {
  const j = toJstDate(d)
  return {
    year: j.getUTCFullYear(),
    month: j.getUTCMonth(),
    day: j.getUTCDate(),
    iso: j.toISOString().slice(0, 10),
  }
}

export const formatYmd = (year: number, month0: number, day: number): string => {
  const m = String(month0 + 1).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${year}-${m}-${d}`
}

// 連続記録日数: 今日 (記録あり) または 昨日 から遡って連続している日数
export const calculateStreak = (recordedSet: Set<string>, today = new Date()): number => {
  let streak = 0
  const j = toJstDate(today)
  // UTC上で操作するためsetUTCDateを使う
  if (!recordedSet.has(j.toISOString().slice(0, 10))) {
    j.setUTCDate(j.getUTCDate() - 1)
  }
  while (recordedSet.has(j.toISOString().slice(0, 10))) {
    streak++
    j.setUTCDate(j.getUTCDate() - 1)
  }
  return streak
}
