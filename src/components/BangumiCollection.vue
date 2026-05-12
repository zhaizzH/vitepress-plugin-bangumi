<template>
  <div class="tk-article-page bangumi-collection">
    <div v-if="loading" class="bangumi-loading">正在加载收藏数据...</div>
    <div v-else-if="error" class="bangumi-error">{{ error }}</div>
    <template v-else>
      <div class="tk-doc">
        <!-- Header -->
        <div class="bangumi-header">
          <h1 class="bangumi-title">我的追番</h1>
          <span class="bangumi-count">{{ filteredData.length }} 部</span>
        </div>

        <!-- Filter tabs -->
        <div class="bangumi-filters">
          <button
            v-for="tab in filterTabs"
            :key="tab.value"
            :class="['filter-btn', { active: activeFilter === tab.value }]"
            @click="activeFilter = tab.value; currentPage = 1"
          >
            {{ tab.label }}
            <span class="filter-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Card grid -->
        <div v-if="paginatedData.length" class="bangumi-grid">
          <a
            v-for="item in paginatedData"
            :key="item.subject_id"
            :href="`https://bgm.tv/subject/${item.subject_id}`"
            class="bangumi-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="card-cover">
              <img
                :src="item.images?.medium || item.subject?.images?.medium || ''"
                :alt="item.name_cn || item.name"
                loading="lazy"
              />
              <span class="card-status-tag" :class="'tag-type-' + item.type">
                {{ statusLabel(item.type) }}
              </span>
            </div>

            <div class="card-body">
              <div class="card-title" :title="item.name_cn || item.name">
                {{ item.name_cn || item.name }}
              </div>
              <div class="card-meta-row">
                <span v-if="item.subject?.date" class="card-year">{{ item.subject.date.slice(0, 4) }}</span>
                <span v-if="item.eps > 0" class="card-total">{{ item.eps }} 话</span>
              </div>
              <div v-if="item.eps > 0" class="card-progress">
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    :class="progressClass(item)"
                    :style="{ width: progressPercent(item) + '%' }"
                  />
                </div>
                <span class="progress-label">{{ item.ep_status }}/{{ item.eps }}</span>
              </div>
            </div>
          </a>
        </div>

        <div v-else class="bangumi-empty">暂无数据</div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="bangumi-pagination">
          <button :disabled="currentPage <= 1" @click="currentPage--">上一页</button>
          <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
          <button :disabled="currentPage >= totalPages" @click="currentPage++">下一页</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { BangumiSubject, SubjectType, CollectionType } from '../types'
import { CollectionTypeLabels } from '../types'

const props = withDefaults(defineProps<{
  data?: BangumiSubject[]
  src?: string
  pageSize?: number
}>(), {
  data: () => [],
  src: '/bangumi.json',
  pageSize: 24,
})

const items = ref<BangumiSubject[]>(props.data)
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  if (props.data.length > 0) {
    items.value = props.data
    return
  }
  loading.value = true
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw: any[] = await res.json()
    items.value = raw.map(item => ({
      ...item,
      name: item.subject?.name || '',
      name_cn: item.subject?.name_cn || '',
      images: item.subject?.images,
      eps: item.subject?.eps || 0,
    }))
  } catch (e) {
    error.value = `数据加载失败: ${(e as Error).message}`
  } finally {
    loading.value = false
  }
})

const activeFilter = ref<CollectionType | 'all'>('all')
const currentPage = ref(1)

const filterTabs = computed(() => {
  const counts: Record<string, number> = { all: items.value.length }
  const exists = new Set(items.value.map(d => d.type))
  const tabDefs: { label: string; value: CollectionType | 'all' }[] = [
    { label: '全部', value: 'all' },
  ]
  for (const [val, label] of Object.entries(CollectionTypeLabels)) {
    const v = Number(val) as CollectionType
    if (exists.has(v)) {
      tabDefs.push({ label, value: v })
    }
  }
  for (const d of items.value) {
    const key = String(d.type)
    counts[key] = (counts[key] || 0) + 1
  }
  return tabDefs.map(t => ({
    ...t,
    count: counts[String(t.value)] || 0,
  }))
})

const filteredData = computed(() => {
  let list = items.value
  if (activeFilter.value !== 'all') {
    list = list.filter(d => d.type === activeFilter.value)
  }
  return list.sort((a, b) => {
    if (a.rate !== b.rate) return b.rate - a.rate
    return (b.subject?.date || '') < (a.subject?.date || '') ? -1 : 1
  })
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / props.pageSize))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  return filteredData.value.slice(start, start + props.pageSize)
})

function statusLabel(type: CollectionType): string {
  return CollectionTypeLabels[type] || ''
}

function isCompleted(item: BangumiSubject): boolean {
  return item.eps > 0 && item.ep_status >= item.eps
}

function progressPercent(item: BangumiSubject): number {
  if (item.eps <= 0) return 0
  return Math.min(100, Math.round((item.ep_status / item.eps) * 100))
}

function progressClass(item: BangumiSubject): string {
  if (item.ep_status === 0) return 'prog-idle'
  if (item.ep_status >= item.eps) return 'prog-done'
  return 'prog-active'
}

function ratingClass(rate: number): string {
  if (rate >= 8) return 'rating-high'
  if (rate >= 6) return 'rating-mid'
  return 'rating-low'
}
</script>

<style scoped>
.bangumi-collection {
  --tk-page-width: 1520px;
  max-width: 100%;
}
.bangumi-collection :deep(.tk-doc) {
  background-color: var(--tk-bg-color);
  border-radius: 10px;
  box-shadow: var(--vp-shadow-3);
  padding: 20px 30px;
  overflow-y: auto;
}

/* ---------- Header ---------- */
.bangumi-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.bangumi-title {
  font-size: 32px;
  font-weight: 600;
  line-height: 1;
  margin: 0;
  color: var(--vp-c-text-1);
}
.bangumi-count {
  font-size: 13.6px;
  font-style: oblique;
  font-weight: 300;
  opacity: 0.8;
  color: var(--tk-text-color-secondary, var(--vp-c-text-2));
}

/* ---------- Filters ---------- */
.bangumi-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.filter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: var(--tk-fill-color, var(--vp-c-bg-soft));
  color: var(--tk-text-color-secondary, var(--vp-c-text-2));
  cursor: pointer;
  font-size: var(--tk-home-font-size-small, 13px);
  line-height: 1.4;
  transition: all var(--tk-transition-duration-fast, 0.2s) ease;
}
.filter-btn:hover {
  color: var(--tk-theme-color, var(--vp-c-brand-1));
  background: color-mix(in srgb, var(--tk-theme-color, var(--vp-c-brand-1)) 8%, transparent);
}
.filter-btn.active {
  color: #fff;
  background: var(--tk-theme-color, var(--vp-c-brand-1));
  border-color: var(--tk-theme-color, var(--vp-c-brand-1));
  box-shadow: 0 4px 12px -4px var(--tk-theme-color, var(--vp-c-brand-1));
}
.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  background: var(--tk-fill-color-dark, var(--vp-c-bg-mute));
  color: var(--tk-text-color-secondary, var(--vp-c-text-2));
}
.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
}

/* ---------- Card Grid ---------- */
.bangumi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

@media (min-width: 641px) and (max-width: 1024px) {
  .bangumi-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ---------- Card ---------- */
.bangumi-card {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--tk-bg-color-elm, var(--vp-c-bg-elv));
  box-shadow: var(--tk-card-shadow, 0 2px 10px 2px rgba(0,0,0,0.1));
  text-decoration: none;
  transition: transform var(--tk-transition-duration, 0.3s) cubic-bezier(.34,1.56,.64,1),
              box-shadow var(--tk-transition-duration-slow, 0.5s) ease;
  will-change: transform;
}
.bangumi-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--tk-hover-shadow, 0 6px 24px 6px rgba(0,0,0,0.18));
}

/* --- Cover --- */
.card-cover {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  background: var(--tk-fill-color-dark, var(--vp-c-bg-mute));
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--tk-transition-duration, 0.3s) ease;
}
.bangumi-card:hover .card-cover img {
  transform: scale(1.08);
}

/* Status tag (overlaid on cover) */
.card-status-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.tag-type-1 { /* 想看 */
  background: rgba(230, 162, 60, 0.85);
  color: #fff;
}
.tag-type-2 { /* 看过 */
  background: rgba(103, 194, 58, 0.85);
  color: #fff;
}
.tag-type-3 { /* 在看 */
  background: rgba(64, 158, 255, 0.85);
  color: #fff;
}
.tag-type-4 { /* 搁置 */
  background: rgba(144, 147, 153, 0.8);
  color: #fff;
}
.tag-type-5 { /* 抛弃 */
  background: rgba(245, 108, 108, 0.8);
  color: #fff;
}

/* Completion badge */
.card-complete-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
  color: #fff;
  background: rgba(103, 194, 58, 0.9);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* Rating */
.card-rating {
  position: absolute;
  bottom: 8px;
  right: 8px;
  min-width: 26px;
  height: 22px;
  padding: 0 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  backdrop-filter: blur(4px);
}
.rating-high { background: rgba(231, 76, 60, 0.85); }
.rating-mid  { background: rgba(243, 156, 18, 0.85); }
.rating-low  { background: rgba(149, 165, 166, 0.7); }

/* --- Card Body --- */
.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px 12px;
  flex: 1;
}
.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}
.card-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--tk-text-color-secondary, var(--vp-c-text-3));
}
.card-year {
  font-weight: 500;
}
.card-total {
  opacity: 0.75;
}

/* Progress bar */
.card-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}
.progress-track {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--tk-fill-color-dark, var(--vp-c-bg-mute));
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}
.prog-idle {
  background: var(--tk-text-color-disabled, #c0c4cc);
}
.prog-active {
  background: linear-gradient(90deg, var(--tk-theme-color, var(--vp-c-brand-1)), var(--tk-el-color-primary-light-3, #79bbff));
}
.prog-done {
  background: linear-gradient(90deg, var(--tk-el-color-success, #67c23a), var(--tk-el-color-success-light-3, #95d475));
}
.progress-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--tk-text-color-secondary, var(--vp-c-text-3));
  white-space: nowrap;
}

/* ---------- Empty ---------- */
.bangumi-empty {
  text-align: center;
  padding: 60px 0;
  color: var(--tk-text-color-secondary, var(--vp-c-text-3));
}

/* ---------- Pagination ---------- */
.bangumi-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
.bangumi-pagination button {
  padding: 6px 18px;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--tk-bg-color-elm, var(--vp-c-bg-soft));
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: var(--tk-home-font-size-small, 13px);
  transition: all var(--tk-transition-duration-fast, 0.2s);
}
.bangumi-pagination button:hover:not(:disabled) {
  border-color: var(--tk-theme-color, var(--vp-c-brand-1));
  color: var(--tk-theme-color, var(--vp-c-brand-1));
}
.bangumi-pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-info {
  font-size: var(--tk-home-font-size-small, 13px);
  color: var(--tk-text-color-secondary, var(--vp-c-text-2));
}

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .bangumi-collection :deep(.tk-doc) {
    padding: 12px 14px;
  }
  .bangumi-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .bangumi-title {
    font-size: 24px;
  }
  .filter-btn {
    padding: 4px 12px;
    font-size: 12px;
  }
  .card-body {
    padding: 8px 10px 10px;
  }
  .card-title {
    font-size: 13px;
  }
}
</style>
