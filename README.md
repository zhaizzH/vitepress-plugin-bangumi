# vitepress-plugin-bangumi

[![npm](https://img.shields.io/npm/v/vitepress-plugin-bangumi)](https://www.npmjs.com/package/vitepress-plugin-bangumi)

在 VitePress 站点中展示你的 [Bangumi](https://bgm.tv) 收藏数据。

## 功能

- **构建时自动拉取** — 在 VitePress 构建结束时，自动从 Bangumi API 获取收藏数据并输出为 JSON 文件
- **开发模式支持** — `vitepress dev` 模式下也会生成数据到 `public` 目录，并监听 `.md` 文件变化自动刷新
- **TypeScript 支持** — 提供完整的类型定义
- **内置展示组件** — 提供现成的 Vue 卡片网格组件，支持筛选、分页、进度显示

## 安装

```bash
npm install vitepress-plugin-bangumi
```

## 使用

### 1. 在 VitePress 配置中注册插件

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { BangumiPlugin } from 'vitepress-plugin-bangumi'

export default defineConfig({
  vite: {
    plugins: [
      BangumiPlugin({
        userId: '你的Bangumi用户名',
        subjectType: 2,        // 只拉取动画
        collectionType: [2, 3], // 看过 + 在看
      }),
    ],
  },
})
```

### 2. 创建展示页面

```vue
<!-- docs/bangumi.md -->
<script setup>
import BangumiCollection from 'vitepress-plugin-bangumi/client'
</script>

<BangumiCollection />
```

## 配置选项

### BangumiPlugin 选项

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `userId` | `string` | — | **必填**。Bangumi 用户名 |
| `limit` | `number` | `50` | 每次请求的条目数上限（最大 100） |
| `outputFile` | `string` | `'bangumi.json'` | 输出的 JSON 文件名 |
| `subjectType` | `SubjectType \| SubjectType[]` | `[]` | 条目类型筛选，不传则获取所有类型 |
| `collectionType` | `CollectionType \| CollectionType[]` | `[]` | 收藏状态筛选，不传则获取所有状态 |
| `baseUrl` | `string` | `'https://api.bgm.tv/v0'` | Bangumi API 基础 URL |
| `userAgent` | `string` | `'vitepress-plugin-bangumi/...'` | 请求时使用的 User-Agent |

### SubjectType 条目类型

| 值 | 类型 | 颜色 |
|----|------|------|
| `1` | 书籍 | `#4a90d9` |
| `2` | 动画 | `#e74c3c` |
| `3` | 音乐 | `#27ae60` |
| `4` | 游戏 | `#f39c12` |
| `6` | 三次元 | `#8e44ad` |

### CollectionType 收藏状态

| 值 | 标签 |
|----|------|
| `1` | 想看 |
| `2` | 看过 |
| `3` | 在看 |
| `4` | 搁置 |
| `5` | 抛弃 |

### BangumiCollection 组件 Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `data` | `BangumiSubject[]` | `[]` | 直接传入数据（跳过 fetch） |
| `src` | `string` | `'/bangumi.json'` | 数据 JSON 文件路径 |
| `pageSize` | `number` | `24` | 每页显示的条目数 |

## 示例

### 拉取所有类型的收藏

```ts
BangumiPlugin({ userId: 'your-id' })
```

### 只拉取动画和游戏

```ts
BangumiPlugin({
  userId: 'your-id',
  subjectType: [2, 4],
})
```

### 自定义数据路径

```ts
BangumiPlugin({
  userId: 'your-id',
  outputFile: 'my-bangumi-data.json',
})
```

然后在组件中指定路径：

```vue
<BangumiCollection src="/my-bangumi-data.json" />
```

### 传入已有数据（跳过 HTTP 请求）

```vue
<script setup>
import data from '../public/bangumi.json'
import BangumiCollection from 'vitepress-plugin-bangumi/client'
</script>

<BangumiCollection :data="data" />
```

## 数据流向

1. `BangumiPlugin` 在构建（或 dev）时调用 Bangumi API
2. 自动分页拉取全部收藏数据
3. 数据写入 `<outDir>/bangumi.json`（dev 模式写入 `public/bangumi.json`）
4. `BangumiCollection` 组件在客户端 fetch 该 JSON 并渲染为卡片网格

## License

MIT
