// CORS 헤더 — ALLOWED_ORIGIN(secret) 이 설정되면 그 오리진만, 아니면 개발 편의상 '*'.
const origin = Deno.env.get('ALLOWED_ORIGIN') ?? '*'

export const corsHeaders = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
