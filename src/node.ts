import type { BangumiOptions, BangumiResponse, BangumiSubject, SubjectType, CollectionType } from './types'

const TAG = '\x1B[36m[vitepress-plugin-bangumi]\x1B[0m'
const WARN = '\x1B[33m[vitepress-plugin-bangumi]\x1B[0m'

function toArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

async function fetchPage(
  options: { baseUrl: string; userAgent: string; userId: string },
  subjectType: SubjectType | undefined,
  collectionType: CollectionType | undefined,
  limit: number,
  offset: number,
): Promise<BangumiResponse> {
  const url = new URL(`${options.baseUrl}/users/${options.userId}/collections`)
  if (subjectType !== undefined) url.searchParams.set('subject_type', String(subjectType))
  if (collectionType !== undefined) url.searchParams.set('type', String(collectionType))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('offset', String(offset))

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': options.userAgent,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(
      `API ${response.status} ${response.statusText}${body ? `\n响应体: ${body.slice(0, 200)}` : ''}`,
    )
  }

  return response.json()
}

export async function fetchBangumiData(options: BangumiOptions): Promise<BangumiSubject[]> {
  const required = {
    userId: options.userId,
    baseUrl: options.baseUrl ?? 'https://api.bgm.tv/v0',
    userAgent:
      options.userAgent ??
      'vitepress-plugin-bangumi/1.0.0 (https://github.com/zhaizzH/vitepress-plugin-bangumi)',
  }

  const limit = Math.min(options.limit ?? 50, 100)
  const subjectTypes: (SubjectType | undefined)[] =
    toArray(options.subjectType).length > 0 ? toArray(options.subjectType) : [undefined]
  const collectionTypes: (CollectionType | undefined)[] =
    toArray(options.collectionType).length > 0 ? toArray(options.collectionType) : [undefined]

  console.log(`${TAG} 开始拉取 Bangumi 收藏数据（用户: ${options.userId}）`)

  const allData: BangumiSubject[] = []

  for (const st of subjectTypes) {
    for (const ct of collectionTypes) {
      const typeLabel =
        st !== undefined || ct !== undefined
          ? ` [${st !== undefined ? `subject_type=${st}` : ''}${st !== undefined && ct !== undefined ? ', ' : ''}${ct !== undefined ? `type=${ct}` : ''}]`
          : ''
      console.log(`${TAG} 请求${typeLabel}...`)

      let offset = 0
      let total = 0

      try {
        const first = await fetchPage(required, st, ct, limit, 0)
        total = first.total
        allData.push(...first.data)
        console.log(`${TAG}   → 第 1 页: ${first.data.length} 条`)

        while (offset + limit < total) {
          offset += limit
          const page = await fetchPage(required, st, ct, limit, offset)
          allData.push(...page.data)
          console.log(`${TAG}   → 第 ${Math.floor(offset / limit) + 1} 页: ${page.data.length} 条`)
        }

        console.log(`${TAG}   ✓ 完成${typeLabel}: 共 ${total} 条`)
      } catch (err) {
        console.warn(`${WARN} 请求失败${typeLabel}:`, (err as Error).message)
      }
    }
  }

  console.log(`${TAG} ✓ 全部完成，共获取 ${allData.length} 条收藏`)
  return allData
}
