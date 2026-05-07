'use client'

// 同じ client bundle 内で BackLink と RecordForm が共有する
// 「未保存の変更あり」フラグ。Reactのレンダリングには関与しないため
// useState ではなくモジュールスコープに置く。
let dirty = false

export const setDirty = (value: boolean): void => {
  dirty = value
}

export const isDirty = (): boolean => dirty