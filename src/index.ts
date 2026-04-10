/**
 * CordovaBuilder Admin MCP Server
 *
 * 基于 Model Context Protocol (MCP) 的服务器应用，用于从本地 API 下载开发环境所需资源。
 *
 * 主要功能：
 * - 从 Docs API（如 http://localhost:3001/api/docs）下载 Node.js
 * - 解析 Swagger/OpenAPI 文档获取下载链接
 * - 支持自定义版本、平台和架构参数
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'
import { DownloadNodeFromDocsInput, type DownloadNodeFromDocsInputType } from './types.js'
import { EnvPreparationError } from './errors.js'
import { downloadNodeFromDocs } from './api-docs.js'
import { log } from './logger.js'

// ==================== MCP Server 初始化与配置 ====================

/**
 * 创建 MCP Server 实例
 * 配置服务器名称、版本和功能特性
 *
 * 服务器名称: cordovabuilder-admin-server-mcp
 * 版本: 0.1.0
 * 能力: 支持 tools（工具调用）
 */
const server = new Server(
  { name: 'cordovabuilder-admin-server-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
)

/**
 * 注册工具列表处理器
 * 当 MCP Client 查询可用工具时，返回工具的定义和参数 schema
 *
 * 当前提供两个工具：
 * 1. download_node_from_docs - 从 Docs API 下载 Node.js
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        // 工具：从 Docs API 下载 Node.js
        name: 'download_node_from_docs',
        title: '从 Docs API 下载 Node.js',
        description:
          '从 /api/docs Swagger 规范中读取配置，并调用 /node/download 接口下载 Node.js。\n' +
          '适用于通过本地 API 服务器获取 Node.js 安装包的场景。\n\n' +
          '工作流程：\n' +
          '1. 访问 http://localhost:3001/api/docs/swagger-ui-init.js\n' +
          '2. 解析 Swagger 文档，检查是否存在 /node/download 端点\n' +
          '3. 调用 POST /node/download 接口下载 Node.js\n' +
          '4. 返回下载结果',
        inputSchema: {
          type: 'object',
          properties: {
            baseUrl: {
              type: 'string',
              description: 'API 基础地址，默认 http://localhost:3001',
              default: 'http://localhost:3001',
            },
            version: {
              type: 'string',
              description: 'Node.js 版本号（可选），如 v18.16.0、v20.11.0',
              placeholder: 'v18.16.0',
              pattern: '^v\\d+\\.\\d+\\.\\d+$',
              examples: ['v18.16.0', 'v20.11.0', 'v16.20.2'],
            },
            platform: {
              type: 'string',
              description: '目标平台（可选）',
              placeholder: 'win32',
              enum: ['win32', 'linux', 'darwin'],
              default: 'win32',
            },
            arch: {
              type: 'string',
              description: '目标架构（可选）',
              placeholder: 'x64',
              enum: ['x64', 'arm64', 'armv7l'],
              default: 'x64',
            },
          },
          additionalProperties: false,
          required: [],
        },
      },
    ],
  }
})

/**
 * 注册工具调用处理器
 * 当 MCP Client 调用工具时，执行相应的业务逻辑
 *
 * 工作流程：
 * 1. 验证工具名称
 * 2. 使用 Zod 验证输入参数
 * 3. 调用对应的业务逻辑函数
 * 4. 返回执行结果
 *
 * @param request - 工具调用请求对象
 * @returns 工具执行结果
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  log.info('接收工具调用请求', {
    tool: request.params.name,
    arguments: request.params.arguments,
  })

  try {
    if (request.params.name === 'download_node_from_docs') {
      const parsed = DownloadNodeFromDocsInput.safeParse(request.params.arguments ?? {})
      if (!parsed.success) {
        log.error('参数验证失败', { error: parsed.error.message })
        throw new EnvPreparationError(
          `参数验证失败: ${parsed.error.message}`,
          'VALIDATION_ERROR',
          parsed.error.errors
        )
      }

      log.info('开始下载 Node.js', parsed.data)
      const text = await downloadNodeFromDocs(parsed.data as DownloadNodeFromDocsInputType)
      log.success('Node.js 下载完成')

      return { content: [{ type: 'text', text }] }
    }

    throw new EnvPreparationError(`未知的工具: ${request.params.name}`, 'UNKNOWN_TOOL')
  } catch (error) {
    let errorMessage: string
    let errorCode: string

    if (error instanceof EnvPreparationError) {
      errorMessage = error.message
      errorCode = error.code
    } else if (error instanceof z.ZodError) {
      errorMessage = `参数验证失败: ${error.message}`
      errorCode = 'ZOD_VALIDATION_ERROR'
    } else {
      errorMessage = error instanceof Error ? error.message : String(error)
      errorCode = 'UNKNOWN_ERROR'
    }

    log.error('工具执行失败', { code: errorCode, message: errorMessage })

    return {
      content: [
        {
          type: 'text',
          text: `❌ 操作失败\n\n错误代码: ${errorCode}\n详细信息: ${errorMessage}`,
        },
      ],
      isError: true,
    }
  }
})

// ==================== 启动服务器 ====================

/**
 * 创建标准输入输出传输层并启动服务器
 * 服务器将通过 stdio 与 MCP Client 进行通信
 *
 * 通信方式：
 * - 输入: 通过 stdin 接收 JSON-RPC 请求
 * - 输出: 通过 stdout 发送 JSON-RPC 响应
 * - 日志: 通过 stderr 输出日志信息（不干扰 JSON-RPC 协议）
 */
async function startServer() {
  try {
    log.info('正在启动 MCP Server...')
    const transport = new StdioServerTransport()
    await server.connect(transport)
    log.success('MCP Server 已成功启动', 'Server')
    log.info(`当前日志级别: ${process.env.LOG_LEVEL || 'info'}`)
  } catch (error) {
    log.error('MCP Server 启动失败', { error })
    process.exit(1)
  }
}

startServer().catch((error) => {
  log.error('未捕获的错误', { error })
  process.exit(1)
})
