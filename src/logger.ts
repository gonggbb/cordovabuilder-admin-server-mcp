/**
 * 日志管理模块
 *
 * 使用 Winston 日志库提供结构化的日志输出
 * 所有日志输出到 stderr，不干扰 MCP 协议的 JSON-RPC 通信（stdout）
 */

import winston from 'winston'

// 创建自定义格式，确保彩色输出
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let logMessage = `[${timestamp}] [${level}] ${message}`

    // 如果有元数据，格式化输出
    if (Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`
    }

    return logMessage
  })
)

// 创建 Winston 日志实例
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // 控制台输出（stderr）- 用于 MCP Inspector
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'info',
      stderrLevels: ['error', 'warn', 'info', 'debug'], // 所有级别都输出到 stderr
      forceConsole: true, // 强制使用控制台输出
    }),
    // 文件输出（可选）- 用于持久化日志
    ...(process.env.LOG_FILE
      ? [
          new winston.transports.File({
            filename: process.env.LOG_FILE,
            level: 'debug',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false, // 发生错误时不退出进程
})

// 导出便捷的日志方法
export const log = {
  error: (msg: string, meta?: any) => logger.error(msg, meta),
  warn: (msg: string, meta?: any) => logger.warn(msg, meta),
  info: (msg: string, meta?: any) => logger.info(msg, meta),
  debug: (msg: string, meta?: any) => logger.debug(msg, meta),
  success: (msg: string, meta?: any) => logger.info(`✓ ${msg}`, meta),
}
