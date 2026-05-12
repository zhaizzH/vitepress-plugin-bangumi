/// <reference types="vite/client" />

import { DefineComponent } from 'vue'

interface BangumiSubject {
  subject_id: number
  subject_type: number
  type: number
  rate: number
  name: string
  name_cn: string
  images?: { small: string; grid: string; large: string; medium: string }
  ep_status: number
  eps: number
  subject?: {
    id: number
    name: string
    name_cn: string
    images?: { small: string; grid: string; large: string; medium: string }
    date: string
    platform: string
    eps: number
  }
}

declare const BangumiCollection: DefineComponent<
  {
    data?: BangumiSubject[]
    src?: string
    pageSize?: number
  },
  {},
  any
>

export default BangumiCollection
