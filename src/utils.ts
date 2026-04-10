/**
 * 工具函数模块
 *
 * 提供通用的工具函数，包括文件操作、命令执行等基础功能
 *
 * 主要功能：
 * - 目录管理：确保目录存在、检查文件是否存在
 * - 数据下载：从 URL 下载 JSON、文本或文件
 * - 命令执行：运行系统命令并获取输出
 */

import { mkdir, createWriteStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { EnvPreparationError, DownloadError } from './errors.js'
import { log } from './logger.js'

// ==================== 文件操作工具 ====================

/**
 * 确保目录存在，如果不存在则递归创建
 *
 * 使用 Node.js 的 mkdir 函数，设置 recursive 选项以创建完整的目录路径
 *
 * @param dir - 需要确保存在的目录路径
 * @returns Promise，在目录创建完成后 resolve
 * @throws 如果目录创建失败则抛出 EnvPreparationError 错误
 *
 * @example
 * ```typescript
 * await ensureDir('./downloads/node')
 * // 创建 ./downloads/node 目录，如果父目录不存在也会一并创建
 * ```
 */
export function ensureDir(dir: string) {
  return new Promise<void>((resolve, reject) => {
    mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        log.error('无法创建目录', { dir, error: err.message })
        reject(new EnvPreparationError(`无法创建目录: ${dir}`, 'DIR_CREATE_ERROR', err))
      } else {
        log.debug('目录创建成功', { dir })
        resolve()
      }
    })
  })
}

/**
 * 检查文件或目录是否存在
 *
 * 使用 stat 函数检查路径，如果路径存在则返回 true
 *
 * @param p - 文件或目录的路径
 * @returns 如果存在返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * const exists = await fileExists('./downloads/node-v20.msi')
 * if (!exists) {
 *   // 文件不存在，执行下载
 * }
 * ```
 */
export async function fileExists(p: string) {
  try {
    await stat(p)
    return true
  } catch (error) {
    // 文件不存在是正常情况，不抛出错误
    return false
  }
}

// ==================== 数据下载工具 ====================

/**
 * 从指定 URL 下载 JSON 数据并解析
 *
 * 使用 fetch API 获取数据，自动解析为 JSON 格式
 *
 * @param url - JSON 数据的 URL 地址
 * @returns 解析后的 JSON 对象（泛型类型 T）
 * @throws 如果 HTTP 请求失败或 JSON 解析失败则抛出 DownloadError 错误
 *
 * @example
 * ```typescript
 * interface VersionInfo {
 *   version: string
 *   files: string[]
 * }
 *
 * const data = await downloadJson<VersionInfo>('https://api.example.com/version.json')
 * console.log(data.version)
 * ```
 */
export async function downloadJson<T>(url: string): Promise<T> {
  try {
    log.debug('下载 JSON 数据', { url })
    const res = await fetch(url)
    if (!res.ok) {
      log.error('JSON 下载失败', { url, status: res.status, statusText: res.statusText })
      throw new DownloadError(url, `HTTP 状态码: ${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    log.debug('JSON 下载成功', { url })
    return data as T
  } catch (error) {
    if (error instanceof DownloadError) {
      throw error
    }
    log.error('JSON 下载异常', {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new DownloadError(url, error instanceof Error ? error.message : String(error))
  }
}

/**
 * 从 URL 下载文本内容
 *
 * 使用 fetch API 获取文本数据，适用于下载配置文件、脚本等文本资源
 *
 * @param url - 文本资源的 URL
 * @returns 下载的文本内容
 * @throws 如果 HTTP 请求失败则抛出 DownloadError 错误
 *
 * @example
 * ```typescript
 * const scriptContent = await downloadText('https://example.com/init.js')
 * console.log(scriptContent.substring(0, 100))
 * ```
 */
export async function downloadText(url: string): Promise<string> {
  try {
    log.debug('下载文本内容', { url })
    const res = await fetch(url)
    if (!res.ok) {
      log.error('文本下载失败', { url, status: res.status, statusText: res.statusText })
      throw new DownloadError(url, `HTTP 状态码: ${res.status} ${res.statusText}`)
    }
    const text = await res.text()
    log.debug('文本下载成功', { url, length: text.length })
    return text
  } catch (error) {
    if (error instanceof DownloadError) {
      throw error
    }
    log.error('文本下载异常', {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
    throw new DownloadError(url, error instanceof Error ? error.message : String(error))
  }
}
