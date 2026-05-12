/** Bangumi 条目类型 */
export type SubjectType = 1 | 2 | 3 | 4 | 6

/** 收藏状态 */
export type CollectionType = 1 | 2 | 3 | 4 | 5

export const SubjectTypeLabels: Record<SubjectType, string> = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元',
}

export const CollectionTypeLabels: Record<CollectionType, string> = {
  1: '想看',
  2: '看过',
  3: '在看',
  4: '搁置',
  5: '抛弃',
}

export const SubjectTypeColors: Record<SubjectType, string> = {
  1: '#4a90d9',
  2: '#e74c3c',
  3: '#27ae60',
  4: '#f39c12',
  6: '#8e44ad',
}

/** Bangumi API 返回的图片信息 */
interface BangumiImages {
  small: string
  grid: string
  large: string
  medium: string
}

/** Bangumi API 返回的单个条目 */
export interface BangumiSubject {
  subject_id: number
  subject_type: SubjectType
  type: CollectionType
  rate: number
  name: string
  name_cn: string
  images: BangumiImages
  ep_status: number
  eps: number
  subject: {
    id: number
    name: string
    name_cn: string
    images: BangumiImages
    date: string
    platform: string
    eps: number
  }
}

/** Bangumi API 分页响应 */
export interface BangumiResponse {
  total: number
  limit: number
  offset: number
  data: BangumiSubject[]
}

/** 插件配置项 */
export interface BangumiOptions {
  /** Bangumi 用户名（必填） */
  userId: string

  /** 拉取条目数量上限（默认 50） */
  limit?: number

  /** 输出 JSON 文件名（默认 'bangumi.json'） */
  outputFile?: string

  /** 条目类型筛选，不传则获取所有类型 */
  subjectType?: SubjectType | SubjectType[]

  /** 收藏状态筛选，不传则获取所有状态 */
  collectionType?: CollectionType | CollectionType[]

  /** Bangumi API 基础 URL（默认 'https://api.bgm.tv/v0'） */
  baseUrl?: string

  /** User-Agent（默认 'vitepress-plugin-bangumi/1.0.0'） */
  userAgent?: string
}
