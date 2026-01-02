/**
 * 火山引擎API签名认证模块
 * 实现HMAC-SHA1签名算法
 *
 * 文档: https://www.volcengine.com/docs/6561/79507
 */

import crypto from 'crypto'

/**
 * 火山引擎配置
 */
export interface VolcEngineConfig {
  appId: string
  accessKeyId: string
  secretAccessKey: string
}

/**
 * 火山引擎API请求签名
 *
 * 签名算法流程:
 * 1. 构建规范请求串
 * 2. 构建待签名字符串
 * 3. 计算签名HMAC-SHA1
 *
 * @param config 火山引擎配置
 * @param method HTTP方法 (GET/POST)
 * @param uri 请求URI (如 /api/v2/asr)
 * @param query 查询参数对象
 * @param headers 请求头对象
 * @returns Base64编码的签名字符串
 */
export function signRequest(
  config: VolcEngineConfig,
  method: string,
  uri: string,
  query: Record<string, string> = {},
  headers: Record<string, string> = {}
): string {
  // 1. 构建规范查询字符串
  const sortedQueryKeys = Object.keys(query).sort()
  const canonicalQuery = sortedQueryKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join('&')

  // 2. 构建规范请求头
  const sortedHeaderKeys = Object.keys(headers).sort()
  const canonicalHeaders = sortedHeaderKeys
    .map(key => `${key.toLowerCase().trim()}:${headers[key].trim()}`)
    .join('\n')
  const signedHeaders = sortedHeaderKeys
    .map(key => key.toLowerCase().trim())
    .join(';')

  // 3. 构建规范请求串
  const hashedPayload = crypto
    .createHash('sha256')
    .update('')
    .digest('hex')

  const canonicalRequest = [
    method.toUpperCase(),
    uri,
    canonicalQuery,
    canonicalHeaders + '\n',
    signedHeaders,
    hashedPayload
  ].join('\n')

  // 4. 构建待签名字符串
  const hashedCanonicalRequest = crypto
    .createHash('sha256')
    .update(canonicalRequest)
    .digest('hex')

  const credentialScope = `cn-north-1/sts/request` // 火山引擎固定区域
  const stringToSign = [
    'HMAC-SHA1',
    '',
    credentialScope,
    hashedCanonicalRequest
  ].join('\n')

  // 5. 计算签名
  const signingKey = crypto
    .createHmac('sha256', config.secretAccessKey)
    .update('cn-north-1/sts/request') // 日期+服务范围
    .digest()

  const signature = crypto
    .createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('base64')

  return signature
}

/**
 * 获取火山引擎API所需的认证Headers
 *
 * @param config 火山引擎配置
 * @returns 包含认证信息的Headers对象
 */
export function getAuthHeaders(config: VolcEngineConfig): Record<string, string> {
  const timestamp = new Date().toISOString().replace(/[:.]|T/, '').split('Z')[0] + 'Z'
  const nonce = uuid() // 使用UUID作为随机数

  return {
    'Content-Type': 'application/json',
    'X-Date': timestamp,
    'X-App-Id': config.appId,
    'X-Request-Id': nonce,
    'Authorization': `HMAC-SHA1 Credential=${config.accessKeyId}`
  }
}

/**
 * 生成UUID (简化版)
 */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 从环境变量加载火山引擎配置
 */
export function loadVolcEngineConfig(): VolcEngineConfig {
  return {
    appId: process.env.VOLCENGINE_APP_ID || '',
    accessKeyId: process.env.VOLCENGINE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.VOLCENGINE_SECRET_ACCESS_KEY || ''
  }
}

/**
 * 验证火山引擎配置是否完整
 */
export function validateConfig(config: VolcEngineConfig): boolean {
  return !!(
    config.appId &&
    config.accessKeyId &&
    config.secretAccessKey
  )
}
