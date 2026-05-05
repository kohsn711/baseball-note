const MESSAGES = [
  '今日も一歩ずつ。続けることが力になる。',
  '昨日の自分を超えていこう。',
  '小さな積み重ねが、大きな差を作る。',
  '焦らず、止まらず、自分のペースで。',
  '体の声を聞きながら、無理せず続けよう。',
  '記録は未来の自分への手紙。',
  'うまくいかない日も、やった分だけ前進。',
  '基本を丁寧に。それが一番の近道。',
  '今日できたことを、ひとつ書き残そう。',
  '休むことも練習のうち。',
] as const

// 同じ日には同じメッセージが出るよう日付ベースで決定的に選ぶ
export const getDailyMessage = (dateIso: string): string => {
  let hash = 0
  for (let i = 0; i < dateIso.length; i++) {
    hash = (hash * 31 + dateIso.charCodeAt(i)) >>> 0
  }
  return MESSAGES[hash % MESSAGES.length]
}
