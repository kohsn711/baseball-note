import type { DailyRecordData } from '@/lib/daily-record'

const PRACTICE_LABELS: Record<string, string> = {
  swing: '素振り',
  tee_batting: 'ティー打撃',
  catch_ball: 'キャッチボール',
  pitching: '投球練習',
  fielding: '守備練習',
  baserunning: '走塁練習',
  free: '自由メモ',
}
const TRAINING_LABELS: Record<string, string> = {
  running: 'ランニング',
  dash: 'ダッシュ',
  pushup: '腕立て',
  situp: '腹筋',
  squat: 'スクワット',
  stretch: 'ストレッチ',
  free: '自由メモ',
}
const MEAL_SLOT_LABELS = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '補食',
} as const
const MEAL_STATUS_LABELS = { ate: '食べた', skipped: '抜いた' } as const
const WATER_LABELS = { low: '少ない', normal: 'ふつう', high: '多い' } as const
const CONDITION_LABELS = { good: '良い', normal: 'ふつう', bad: '悪い' } as const
const BODY_PART_LABELS: Record<string, string> = {
  shoulder: '肩',
  elbow: '肘',
  wrist: '手首',
  back: '腰・背中',
  hip: '股関節',
  knee: '膝',
  ankle: '足首',
  thigh: '太もも',
  calf: 'ふくらはぎ',
  other: 'その他',
}
const AFFECTS_LABELS = { none: 'なし', little: '少しあり', serious: '大きい' } as const

const Section = ({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="rounded-2xl bg-white p-4 shadow-sm">
    <h2 className="mb-3 text-sm font-semibold text-slate-900">{title}</h2>
    <div className="space-y-2 text-sm text-slate-700">{children}</div>
  </section>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-3">
    <span className="shrink-0 text-slate-500">{label}</span>
    <span className="text-right text-slate-900">{value}</span>
  </div>
)

const Memo = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-slate-500">{label}</p>
    <p className="whitespace-pre-wrap break-words text-slate-900">{value}</p>
  </div>
)

const renderPractice = (data: DailyRecordData) => {
  const items: React.ReactNode[] = []
  for (const [type, v] of Object.entries(data.practice)) {
    if (!v) continue
    if (type === 'free') {
      if (v.memo) items.push(<Memo key={type} label="自由メモ" value={v.memo} />)
      continue
    }
    const num = v.count ?? v.durationMinutes
    if (num == null) continue
    const unit = v.count != null ? '回' : '分'
    items.push(<Row key={type} label={PRACTICE_LABELS[type] ?? type} value={`${num} ${unit}`} />)
  }
  return items
}

const renderTraining = (data: DailyRecordData) => {
  const items: React.ReactNode[] = []
  for (const [type, v] of Object.entries(data.training)) {
    if (!v) continue
    if (type === 'free') {
      if (v.memo) items.push(<Memo key={type} label="自由メモ" value={v.memo} />)
      continue
    }
    const num = v.count ?? v.durationMinutes
    if (num == null) continue
    const unit = v.count != null ? '回' : '分'
    items.push(<Row key={type} label={TRAINING_LABELS[type] ?? type} value={`${num} ${unit}`} />)
  }
  return items
}

type Props = {
  data: DailyRecordData
}

export const RecordDetailView = ({ data }: Props) => {
  const practiceItems = renderPractice(data)
  const trainingItems = renderTraining(data)
  const hasMeal =
    data.meal.breakfast ||
    data.meal.lunch ||
    data.meal.dinner ||
    data.meal.snack ||
    data.meal.waterLevel ||
    data.meal.memo
  const c = data.condition
  const hasCondition =
    c.sleepHours != null ||
    c.wakeTime ||
    c.sleepTime ||
    c.weightKg != null ||
    c.condition
  const inj = data.injury
  const hasInjury =
    inj.hasPain ||
    inj.bodyPart ||
    inj.painLevel != null ||
    inj.affectsLevel ||
    inj.memo
  const r = data.reflection
  const hasReflection =
    r.achievements || r.challenges || r.tomorrowPlan || r.mood != null

  const anyEntry =
    practiceItems.length > 0 ||
    trainingItems.length > 0 ||
    hasMeal ||
    hasCondition ||
    hasInjury ||
    hasReflection

  return (
    <div className="space-y-4">
      {!anyEntry && (
        <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
          この日の記録はまだ入力されていません。
        </p>
      )}

      {practiceItems.length > 0 && <Section title="練習">{practiceItems}</Section>}
      {trainingItems.length > 0 && <Section title="体づくり">{trainingItems}</Section>}

      {hasMeal && (
        <Section title="食事">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((slot) => {
            const v = data.meal[slot]
            if (!v) return null
            return (
              <Row
                key={slot}
                label={MEAL_SLOT_LABELS[slot]}
                value={MEAL_STATUS_LABELS[v]}
              />
            )
          })}
          {data.meal.waterLevel && (
            <Row label="水分" value={WATER_LABELS[data.meal.waterLevel]} />
          )}
          {data.meal.memo && <Memo label="食事メモ" value={data.meal.memo} />}
        </Section>
      )}

      {hasCondition && (
        <Section title="体調">
          {c.sleepHours != null && <Row label="睡眠時間" value={`${c.sleepHours} 時間`} />}
          {c.wakeTime && <Row label="起床時刻" value={c.wakeTime} />}
          {c.sleepTime && <Row label="就寝時刻" value={c.sleepTime} />}
          {c.weightKg != null && <Row label="体重" value={`${c.weightKg} kg`} />}
          {c.condition && <Row label="体調" value={CONDITION_LABELS[c.condition]} />}
        </Section>
      )}

      {hasInjury && (
        <Section title="ケガ・痛み">
          <Row label="痛み" value={inj.hasPain ? 'あり' : 'なし'} />
          {inj.bodyPart && (
            <Row label="部位" value={BODY_PART_LABELS[inj.bodyPart] ?? inj.bodyPart} />
          )}
          {inj.painLevel != null && <Row label="痛みレベル" value={`${inj.painLevel} / 5`} />}
          {inj.affectsLevel && (
            <Row label="練習への影響" value={AFFECTS_LABELS[inj.affectsLevel]} />
          )}
          {inj.memo && <Memo label="メモ" value={inj.memo} />}
          <p className="pt-2 text-xs text-slate-500">
            ※ この記録は医療判断ではありません。痛みが続く場合は医療機関に相談してください。
          </p>
        </Section>
      )}

      {hasReflection && (
        <Section title="振り返り">
          {r.mood != null && <Row label="今日の気分" value={`${r.mood} / 5`} />}
          {r.achievements && <Memo label="今日できたこと" value={r.achievements} />}
          {r.challenges && <Memo label="課題・反省" value={r.challenges} />}
          {r.tomorrowPlan && <Memo label="明日やること" value={r.tomorrowPlan} />}
        </Section>
      )}

    </div>
  )
}

export const formatDateHeader = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dow = ['日', '月', '火', '水', '木', '金', '土'][dt.getUTCDay()]
  return `${y}年${m}月${d}日（${dow}）`
}
