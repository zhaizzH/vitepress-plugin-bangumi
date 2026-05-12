# vitepress-plugin-bangumi

[![npm](https://img.shields.io/npm/v/vitepress-plugin-bangumi)](https://www.npmjs.com/package/vitepress-plugin-bangumi)

Display your [Bangumi](https://bgm.tv) collection data in your VitePress site.

## Features

- **Auto-fetch on build** — Automatically fetches collection data from the Bangumi API at the end of VitePress build and outputs it as a JSON file
- **Dev mode support** — Generates data to the `public` directory in `vitepress dev` mode, and auto-refreshes when `.md` files change
- **TypeScript support** — Full type definitions included
- **Built-in display component** — Ready-to-use Vue card grid component with filtering, pagination, and progress display

## Installation

```bash
npm install vitepress-plugin-bangumi
```

## Usage

### 1. Register the plugin in VitePress config

```ts
// .vitepress/config.ts
import { defineConfig } from 'vitepress'
import { BangumiPlugin } from 'vitepress-plugin-bangumi'

export default defineConfig({
  vite: {
    plugins: [
      BangumiPlugin({
        userId: 'your-bangumi-username',
        subjectType: 2,        // only anime
        collectionType: [2, 3], // completed + watching
      }),
    ],
  },
})
```

### 2. Create a display page

```vue
<!-- docs/bangumi.md -->
<script setup>
import BangumiCollection from 'vitepress-plugin-bangumi/client'
</script>

<BangumiCollection />
```

## Configuration

### BangumiPlugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `userId` | `string` | — | **Required**. Your Bangumi username |
| `limit` | `number` | `50` | Max items per request (max 100) |
| `outputFile` | `string` | `'bangumi.json'` | Output JSON filename |
| `subjectType` | `SubjectType \| SubjectType[]` | `[]` | Filter by subject type, omit for all |
| `collectionType` | `CollectionType \| CollectionType[]` | `[]` | Filter by collection status, omit for all |
| `baseUrl` | `string` | `'https://api.bgm.tv/v0'` | Bangumi API base URL |
| `userAgent` | `string` | `'vitepress-plugin-bangumi/...'` | User-Agent header for requests |

### SubjectType

| Value | Type | Color |
|-------|------|-------|
| `1` | Book | `#4a90d9` |
| `2` | Anime | `#e74c3c` |
| `3` | Music | `#27ae60` |
| `4` | Game | `#f39c12` |
| `6` | Real World | `#8e44ad` |

### CollectionType

| Value | Label |
|-------|-------|
| `1` | Wish |
| `2` | Completed |
| `3` | Watching |
| `4` | On Hold |
| `5` | Dropped |

### BangumiCollection Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `BangumiSubject[]` | `[]` | Pass data directly (skips fetch) |
| `src` | `string` | `'/bangumi.json'` | JSON data file path |
| `pageSize` | `number` | `24` | Items per page |

## Examples

### Fetch all collection types

```ts
BangumiPlugin({ userId: 'your-id' })
```

### Fetch only anime and games

```ts
BangumiPlugin({
  userId: 'your-id',
  subjectType: [2, 4],
})
```

### Custom data path

```ts
BangumiPlugin({
  userId: 'your-id',
  outputFile: 'my-bangumi-data.json',
})
```

Then specify the path in the component:

```vue
<BangumiCollection src="/my-bangumi-data.json" />
```

### Pass existing data (skip HTTP requests)

```vue
<script setup>
import data from '../public/bangumi.json'
import BangumiCollection from 'vitepress-plugin-bangumi/client'
</script>

<BangumiCollection :data="data" />
```

## Data Flow

1. `BangumiPlugin` calls the Bangumi API during build (or dev)
2. Automatically paginates through all collection data
3. Writes data to `<outDir>/bangumi.json` (or `public/bangumi.json` in dev mode)
4. `BangumiCollection` component fetches the JSON on the client and renders it as a card grid

## License

MIT
