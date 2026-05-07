import Link from 'next/link'
import { formatYmd } from '@/lib/date-jst'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

type Props = {
  year: number
  month0: number
  todayIso: string
  recordedDates: string[]
  baseHref: string
}

export const CoachCalendar = ({
  year,
  month0,
  todayIso,
  recordedDates,
  baseHref,
}: Props) => {
  const recordedSet = new Set(recordedDates)

  const firstDow = new Date(Date.UTC(year, month0, 1)).getUTCDay()
  const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
  const cells: { day: number | null; iso: string | null }[] = []
  for (let i = 0; i < firstDow; i++) cells.push({ day: null, iso: null })
  for (let d = 1; d <= lastDay; d++) {
    cells.push({ day: d, iso: formatYmd(year, month0, d) })
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, iso: null })

  const prevMonth0 = month0 === 0 ? 11 : month0 - 1
  const prevYear = month0 === 0 ? year - 1 : year
  const nextMonth0 = month0 === 11 ? 0 : month0 + 1
  const nextYear = month0 === 11 ? year + 1 : year

  const monthHref = (y: number, m0: number) =>
    `${baseHref}?year=${y}&month=${m0 + 1}`

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={monthHref(prevYear, prevMonth0)}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          aria-label="前の月"
        >
          ‹
        </Link>
        <div className="text-sm font-semibold text-slate-900">
          {year}年 {month0 + 1}月
        </div>
        <Link
          href={monthHref(nextYear, nextMonth0)}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          aria-label="次の月"
        >
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {cells.map((c, i) => {
          if (c.day === null || !c.iso) {
            return <div key={i} className="aspect-square" />
          }
          const recorded = recordedSet.has(c.iso)
          const isToday = c.iso === todayIso
          const inFuture = c.iso > todayIso
          const Cell = (
            <div
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm ${
                isToday ? 'bg-slate-900 text-white' : 'text-slate-800'
              } ${recorded && !isToday ? 'hover:bg-slate-100' : ''}`}
            >
              <span>{c.day}</span>
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  recorded ? (isToday ? 'bg-emerald-300' : 'bg-emerald-500') : 'bg-transparent'
                }`}
                aria-hidden
              />
            </div>
          )
          if (recorded && !inFuture) {
            return (
              <Link key={i} href={`${baseHref}/record/${c.iso}`}>
                {Cell}
              </Link>
            )
          }
          return <div key={i}>{Cell}</div>
        })}
      </div>
    </div>
  )
}
