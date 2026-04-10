/**
 * 自定义错误类模块
 *
 * 定义项目中使用的各种自定义错误类，提供更详细的错误信息和错误类型分类
 */

// ==================== 基础错误类 ====================

/**
 * 环境准备过程中的自定义错误基类
 * 提供更详细的错误信息和错误类型
 */
export class EnvPreparationError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'ENV_PREPARATION_ERROR',
    public readonly details?: any
  ) {
    super(message)
    this.name = 'EnvPreparationError'
  }
}

// ==================== 具体错误类 ====================

/**
 * 下载失败的错误类
 */
export class DownloadError extends EnvPreparationError {
  constructor(url: string, reason: string) {
    super(`下载失败: ${url}\n原因: ${reason}`, 'DOWNLOAD_ERROR', { url, reason })
    this.name = 'DownloadError'
  }
}

/**
 * 安装失败的错误类
 */
export class InstallationError extends EnvPreparationError {
  constructor(component: string, exitCode: number, stderr?: string) {
    const msg = `安装 ${component} 失败 (退出码: ${exitCode})${stderr ? `\n错误信息: ${stderr}` : ''}`
    super(msg, 'INSTALLATION_ERROR', { component, exitCode, stderr })
    this.name = 'InstallationError'
  }
}

/**
 * 平台不支持的错误类
 */
export class PlatformNotSupportedError extends EnvPreparationError {
  constructor(platform: string) {
    super(`当前平台 (${platform}) 不受支持。此工具仅支持 Windows 系统。`, 'PLATFORM_NOT_SUPPORTED')
    this.name = 'PlatformNotSupportedError'
  }
}
