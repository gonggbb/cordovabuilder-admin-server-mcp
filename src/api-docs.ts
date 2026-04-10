/**
 * Docs API 处理模块
 *
 * 负责从本地 API 下载 Node.js
 * 主要用于调用 http://localhost:3001/node/download 接口
 *
 * 工作流程：
 * 1. 使用传入的版本号或默认版本
 * 2. 构造 POST 请求调用下载 API
 * 3. 返回执行结果摘要
 */

import type { DownloadNodeFromDocsInputType } from './types.js'
import { log } from './logger.js'

// ==================== 主要导出函数 ====================

/**
 * 从 Docs API 下载 Node.js
 *
 * 完整流程：
 * 1. 确定 Node.js 版本号（优先使用传入参数，否则使用默认值）
 * 2. 构造 POST 请求调用下载 API
 * 3. 返回执行结果摘要
 *
 * @param input - 下载配置参数
 * @param input.baseUrl - API 基础地址（默认 http://localhost:3001）
 * @param input.version - Node.js 版本号（可选，不指定则使用默认值 v18.16.0）
 * @param input.platform - 目标平台（可选）
 * @param input.arch - 目标架构（可选）
 * @returns 执行结果的多行文本摘要
 * @throws 如果请求失败则抛出错误
 */
export async function downloadNodeFromDocs(input: DownloadNodeFromDocsInputType): Promise<string> {
  // 记录函数调用参数
  log.info('开始下载 Node.js', {
    baseUrl: input.baseUrl ?? 'http://localhost:3001',
    version: input.version,
    platform: input.platform,
    arch: input.arch,
  })

  // 清理并标准化 baseUrl（去除末尾的斜杠）
  const baseUrl = (input.baseUrl ?? 'http://localhost:3001').replace(/\/+$/, '')

  // 1. 确定 Node.js 版本号（优先使用传入参数，否则使用默认值）
  const version = input.version || 'v18.16.0'

  log.info('确定使用 Node.js 版本', { version })

  // 2. 构造下载请求 URL 和参数
  const nodePath = '/node/download'
  const url = new URL(`${baseUrl}${nodePath}`)
  url.searchParams.set('version', version)

  // 添加可选的平台和架构参数
  if (input.platform) url.searchParams.set('platform', input.platform)
  if (input.arch) url.searchParams.set('arch', input.arch)

  log.info('准备发送下载请求', { module: 'API-DOCS' })
  log.debug('下载请求配置', { url: url.toString() })

  // 3. 发送 POST 请求调用下载 API
  log.debug('发送 POST 请求到下载 API')
  const res = await fetch(url.toString(), { method: 'POST' })
  const text = await res.text()

  log.info('下载 API 响应', { status: res.status, responseLength: text.length })
  log.debug('API 响应内容', { response: text })

  // 4. 构建结果摘要
  const lines = [
    `请求地址: POST ${url.toString()}`,
    `HTTP 状态码: ${res.status}`,
    `响应内容: ${text}`,
  ]

  log.success('Node.js 下载完成', 'API-DOCS')

  // 返回多行结果，使用换行符分隔
  return lines.join('\n')
}
