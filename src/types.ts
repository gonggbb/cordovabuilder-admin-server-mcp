/**
 * 类型定义模块
 *
 * 包含项目中所有的 TypeScript 类型定义、接口和 Zod Schema
 * 用于参数验证和类型安全
 */

import { z } from 'zod'

// ==================== Docs API 输入参数定义 ====================

/**
 * 支持的平台枚举
 */
export const PlatformEnum = z.enum(['win32', 'linux', 'darwin'])
export type PlatformType = z.infer<typeof PlatformEnum>

/**
 * 支持的架构枚举
 */
export const ArchEnum = z.enum(['x64', 'arm64', 'armv7l'])
export type ArchType = z.infer<typeof ArchEnum>

/**
 * Node.js 版本号正则表达式
 * 格式: v{主版本}.{次版本}.{修订版本}，如 v18.16.0
 */
const VersionPattern = /^v\d+\.\d+\.\d+$/

/**
 * 从 Docs API 下载 Node.js 的输入参数 Schema
 * 使用 Zod 进行类型安全的参数验证
 */
export const DownloadNodeFromDocsInput = z.object({
  /** API 基础地址，默认 http://localhost:3001 */
  baseUrl: z.string().url('必须是有效的 URL 地址').optional(),

  /** Node.js 版本号（可选），必须符合语义化版本格式 */
  version: z
    .string()
    .regex(VersionPattern, '版本号格式不正确，应为 v{主版本}.{次版本}.{修订版本}，如 v18.16.0')
    .optional(),

  /** 目标平台（可选） */
  platform: PlatformEnum.optional(),

  /** 目标架构（可选） */
  arch: ArchEnum.optional(),
})

/** 从 Zod Schema 推断出的 TypeScript 类型 */
export type DownloadNodeFromDocsInputType = z.infer<typeof DownloadNodeFromDocsInput>

// ==================== API 响应类型定义 ====================

/** Node.js 版本索引项 */
export type NodeIndexItem = {
  version: string
  lts: string | boolean | null
  files: string[]
}

/** Adoptium JDK 资源信息 */
export type AdoptiumAsset = {
  binary: {
    package: {
      link: string
      name: string
    }
  }
}
