'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { formatYmd } from '@/lib/date-jst'

type Props = {
  initialYear: number
  initialMonth0: number
  todayIso: string
  recordedDates: string[]
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const

export const Calendar = ({ initialYear, initialMonth0, todayIso, recordedDates }: Props) => {
  const [year, setYear] = useState(initialYear)
  const [month0, setMonth0] = useState(initialMonth0)
  const recordedSet = useMemo(() => new Set(recordedDates), [recordedDates])

  const cells = useMemo(() => {
    const firstDow = new Date(Date.UTC(year, month0, 1)).getUTCDay()
    const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
    const arr: { day: number | null; iso: string | null }[] = []
    for (let i = 0; i < firstDow; i++) arr.push({ day: null, iso: null })
    for (let d = 1; d <= lastDay; d++) {
      arr.push({ day: d, iso: formatYmd(year, month0, d) })
    }
    while (arr.length % 7 !== 0) arr.push({ day: null, iso: null })
    return arr
  }, [year, month0])

  const goPrev = () => {
    if (month0 === 0) {
      setYear(year - 1)
      setMonth0(11)
    } else {
      setMonth0(month0 - 1)
    }
  }
  const goNext = () => {
    if (month0 === 11) {
      setYear(year + 1)
      setMonth0(0)
    } else {
      setMonth0(month0 + 1)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          aria-label="前の月"
        >
          ‹
        </button>
        <div className="text-sm font-semibold text-slate-900">
          {year}年 {month0 + 1}月
        </div>
        <button
          type="button"
          onClick={goNext}
          className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          aria-label="次の月"
        >
          ›
        </button>
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
          if (c.day === null || !c.iso) return <div key={i} className="aspect-square" />
          const recorded = recordedSet.has(c.iso)
          const isToday = c.iso === todayIso
          const inFuture = c.iso > todayIso
          const cell = (
            <div
              className={`flex aspect-square flex-col items-center justify-center rounded-md text-sm ${
                isToday ? 'bg-orange-500 font-bold text-white shadow-sm' : 'text-slate-800'
              } ${recorded && !isToday ? 'hover:bg-slate-100' : ''}`}
            >
              <span>{c.day}</span>
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  recorded ? (isToday ? 'bg-white/80' : 'bg-orange-400') : 'bg-transparent'
                }`}
                aria-hidden
              />
            </div>
          )
          if (recorded && !inFuture) {
            return (
              <Link key={i} href={`/records/${c.iso}/detail`}>
                {cell}
              </Link>
            )
          }
          return <div key={i}>{cell}</div>
        })}
      </div>
    </div>
  )
}
