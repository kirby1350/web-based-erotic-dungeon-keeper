import crypto from 'node:crypto'

export interface CloudStorageConfig {
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  region?: string
  publicBaseUrl?: string
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * 零依赖 S3 兼容对象存储上传（AWS Signature V4 PUT）。
 * 兼容 Cloudflare R2、AWS S3、MinIO、Google Cloud Storage (HMAC)、Backblaze B2、阿里云 OSS / 腾讯云 COS。
 */
export async function uploadToS3Compatible(
  cfg: CloudStorageConfig,
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const endpointUrl = new URL(cfg.endpoint.replace(/\/+$/, ''))
  const region = (cfg.region || 'auto').trim()
  const cleanKey = objectKey.replace(/^\/+/, '')
  const encodedPath = [cfg.bucket, ...cleanKey.split('/')].map(encodeRfc3986).join('/')
  const basePath = endpointUrl.pathname.replace(/\/+$/, '')
  const canonicalUri = `${basePath}/${encodedPath}`.replace(/\/+/g, '/')
  const putUrl = `${endpointUrl.origin}${canonicalUri}`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const payloadHash = sha256Hex(body)
  const host = endpointUrl.host

  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join('\n') + '\n'
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    'PUT',
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n')

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, 's3')
  const kSigning = hmac(kService, 'aws4_request')
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex')

  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`云端对象存储上传失败 (${res.status}): ${errText.slice(0, 240)}`)
  }

  if (cfg.publicBaseUrl?.trim()) {
    return `${cfg.publicBaseUrl.trim().replace(/\/+$/, '')}/${cleanKey}`
  }
  return putUrl
}

export function resolveCloudConfig(override?: Partial<CloudStorageConfig>): CloudStorageConfig | null {
  const endpoint = (override?.endpoint || process.env.IMAGE_CLOUD_ENDPOINT || process.env.S3_ENDPOINT || '').trim()
  const bucket = (override?.bucket || process.env.IMAGE_CLOUD_BUCKET || process.env.S3_BUCKET || '').trim()
  const accessKeyId = (override?.accessKeyId || process.env.IMAGE_CLOUD_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID || '').trim()
  const secretAccessKey = (override?.secretAccessKey || process.env.IMAGE_CLOUD_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY || '').trim()
  const region = (override?.region || process.env.IMAGE_CLOUD_REGION || process.env.S3_REGION || 'auto').trim()
  const publicBaseUrl = (override?.publicBaseUrl || process.env.IMAGE_CLOUD_PUBLIC_URL || process.env.S3_PUBLIC_URL || '').trim()
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null
  return { endpoint, bucket, accessKeyId, secretAccessKey, region, publicBaseUrl }
}
