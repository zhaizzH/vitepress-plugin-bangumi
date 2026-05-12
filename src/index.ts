import path from 'path'
import fs from 'fs-extra'
import type { PluginOption } from 'vite'
import type { BangumiOptions } from './types'
import { fetchBangumiData } from './node'
import { SubjectTypeLabels, CollectionTypeLabels, SubjectTypeColors } from './types'

export type { BangumiOptions, BangumiSubject, SubjectType, CollectionType } from './types'
export { SubjectTypeLabels, CollectionTypeLabels, SubjectTypeColors }

const TAG = '\x1B[36m[vitepress-plugin-bangumi]\x1B[0m'
const WARN = '\x1B[33m[vitepress-plugin-bangumi]\x1B[0m'
const ERR = '\x1B[31m[vitepress-plugin-bangumi]\x1B[0m'

let _devServerActive = false

function resolveOptions(userOptions: BangumiOptions) {
  return {
    userId: userOptions.userId,
    limit: userOptions.limit ?? 50,
    outputFile: userOptions.outputFile ?? 'bangumi.json',
    subjectType: userOptions.subjectType ?? [],
    collectionType: userOptions.collectionType ?? [],
    baseUrl: userOptions.baseUrl ?? 'https://api.bgm.tv/v0',
    userAgent:
      userOptions.userAgent ??
      'vitepress-plugin-bangumi/1.0.0 (https://github.com/zhaizzH/vitepress-plugin-bangumi)',
  }
}

async function writeBangumiData(
  options: ReturnType<typeof resolveOptions>,
  targetDir: string,
): Promise<void> {
  try {
    await fs.ensureDir(targetDir)
    const data = await fetchBangumiData(options)
    const outputPath = path.join(targetDir, options.outputFile)
    await fs.writeJson(outputPath, data, { spaces: 2 })
    const okMark = '\x1B[32m✓\x1B[0m'
    console.log(`${TAG} ${okMark} 已写入 ${outputPath}（${data.length} 条）`)
  } catch (err) {
    console.error(`${ERR} 写入数据失败:`, err)
  }
}

/**
 * VitePress Bangumi 插件
 *
 * 在构建结束时自动请求 Bangumi API 并将收藏数据写入 JSON 文件，
 * 可在 Vue 组件中读取使用。
 *
 * @example
 * ```ts
 * // .vitepress/config.ts
 * import { BangumiPlugin } from 'vitepress-plugin-bangumi'
 *
 * export default defineConfig({
 *   vite: {
 *     plugins: [
 *       BangumiPlugin({
 *         userId: 'your-bgm-user-id',
 *         subjectType: 2,      // 只拉取动画
 *         collectionType: [2, 3], // 看过 + 在看
 *       })
 *     ]
 *   }
 * })
 * ```
 */
export function BangumiPlugin(userOptions?: BangumiOptions): PluginOption {
  if (!userOptions?.userId) {
    console.warn(`${WARN} 未配置 userId，插件已跳过。`)
    return { name: 'vitepress-plugin-bangumi', enforce: 'pre' }
  }

  const options = resolveOptions(userOptions)
  let initialized = false

  return {
    name: 'vitepress-plugin-bangumi',
    enforce: 'pre',
    configResolved(config: any) {
      if (initialized) return
      initialized = true

      const vpConfig = config.vitepress
      if (!vpConfig) {
        console.warn(`${WARN} 未检测到 VitePress 配置，插件仅在 VitePress 项目中生效。`)
        return
      }

      const originalBuildEnd = vpConfig.buildEnd
      vpConfig.buildEnd = async (siteConfig: any) => {
        await originalBuildEnd?.(siteConfig)
        if (_devServerActive) return

        console.log(`\n${TAG} 开始生成 ${options.outputFile}...`)
        console.time(`${TAG} 完成`)
        await writeBangumiData(options, siteConfig.outDir)
        console.timeEnd(`${TAG} 完成`)
        console.log()
      }

      if (config.command === 'serve') {
        _devServerActive = true
        return writeBangumiData(options, config.publicDir)
      }
    },
    configureServer(server: any) {
      const vpConfig = server.config.vitepress
      if (!vpConfig) return

      const outputPath = path.join(server.config.publicDir, options.outputFile)
      if (server.watcher.unwatch) {
        server.watcher.unwatch(outputPath.replace(/\\/g, '/'))
      }

      const handler = (filePath: string) => {
        if (!filePath.endsWith('.md')) return
        console.log(`\n${TAG} 检测到 .md 变化，重新拉取数据...`)
        writeBangumiData(options, server.config.publicDir).catch(() => {})
      }

      server.watcher.on('change', handler)
      server.watcher.on('add', handler)
    },
  }
}
