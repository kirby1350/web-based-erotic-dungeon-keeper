import { NextRequest, NextResponse } from 'next/server'
import { CHAT_MODELS } from '@/lib/types'

export const runtime = 'edge'

const CHAT_TEMPERATURE = 0.9
// Generous cap: a rich scene plus the trailing [STATS]/[DESC] JSON must both fit,
// otherwise the structured tail gets truncated and can't be parsed.
const CHAT_MAX_TOKENS = 4096
const DEFAULT_CHAT_MODEL = 'x-apex-surge-0505-16k'
const DEFAULT_GROK_MODEL = 'grok-4-latest'
const GROK_ENDPOINT = 'https://api.x.ai/v1/chat/completions'
const DZMM_ENDPOINT = 'https://api.sillytraven.dev/api/ai/v2/chat/completions'
const DZMM_MODELS_ENDPOINT = 'https://api.sillytraven.dev/api/ai/v2/models'
const PREFERRED_DZMM_MODELS = ['x-apex-surge-0505-16k', 'x-apex-surge-0923-a-16k', 'nalang-max-0826-16k']

let dzmmModelCache: { at: number; ids: string[] } | null = null

async function listDzmmModels(key: string): Promise<string[]> {
  if (dzmmModelCache && Date.now() - dzmmModelCache.at < 5 * 60 * 1000) return dzmmModelCache.ids
  const response = await fetch(DZMM_MODELS_ENDPOINT, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  })
  if (!response.ok) return dzmmModelCache?.ids ?? []
  const data = await response.json()
  const ids = (Array.isArray(data?.data) ? data.data : [])
    .map((item: { id?: unknown }) => item?.id)
    .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
  if (ids.length > 0) dzmmModelCache = { at: Date.now(), ids }
  return ids
}

function chooseDzmmModel(requested: string, ids: string[]): string {
  if (ids.includes(requested)) return requested
  for (const preferred of PREFERRED_DZMM_MODELS) {
    if (ids.includes(preferred)) return preferred
  }
  return ids.find((id) => id.endsWith('-16k')) ?? ids[0] ?? requested
}

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { messages, model, grokApiKey, userId, conversationId } = body ?? {}
  if (!Array.isArray(messages) || messages.length === 0 || messages.some(
    (m) => !m || !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string',
  )) {
    return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
  }

  // Determine which provider to use based on the selected model
  const modelMeta = CHAT_MODELS.find((m) => m.value === model)
  const isGrok = modelMeta?.provider === 'grok'

  if (isGrok) {
    const key = grokApiKey || process.env.GROK_API_KEY
    if (!key) {
      return NextResponse.json({ error: '未配置 Grok API Key' }, { status: 401 })
    }
    try {
      const response = await fetch(GROK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: model || DEFAULT_GROK_MODEL,
          messages,
          stream: true,
          temperature: CHAT_TEMPERATURE,
        }),
        signal: req.signal,
      })
      if (!response.ok) {
        const err = await response.text()
        return NextResponse.json({ error: `Grok API 错误: ${err}` }, { status: response.status })
      }
      return new NextResponse(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  // Default provider
  const key = process.env.DZMM_API_TOKEN || process.env.CHAT_API_KEY
  if (!key) {
    return NextResponse.json({ error: '请在服务端配置 DZMM_API_TOKEN' }, { status: 401 })
  }

  try {
    const requested = typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_CHAT_MODEL
    const known = await listDzmmModels(key)
    const resolved = known.length > 0 ? chooseDzmmModel(requested, known) : requested
    const response = await fetch(DZMM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: resolved,
        style: 'standard',
        user_name: '城主',
        user_id: typeof userId === 'string' && userId ? userId : crypto.randomUUID(),
        conversation_id: typeof conversationId === 'string' && conversationId ? conversationId : crypto.randomUUID(),
        request_id: crypto.randomUUID(),
        card: {
          name: '地下城主',
          description: '地下城的叙述者。城主布置陷阱和魔物，叙述闯入者身上发生的事。',
          first_message: '准备就绪，请告诉我接下来要做什么。',
          system_prompt: messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n'),
        },
        context: [],
        messages: messages.filter((m) => m.role !== 'system'),
        temperature: CHAT_TEMPERATURE,
        max_tokens: CHAT_MAX_TOKENS,
      }),
      signal: req.signal,
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `API 错误: ${err}` }, { status: response.status })
    }

    if (!response.body) {
      return NextResponse.json({ error: 'DZMM returned an empty stream' }, { status: 502 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    }
    if (resolved !== requested) headers['x-resolved-model'] = resolved
    return new NextResponse(response.body, { headers })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
