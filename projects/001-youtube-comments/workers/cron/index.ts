/**
 * Autonomey Cron Worker
 * Pages 앱의 스케줄 API를 주기적으로 호출
 *
 * Cron 스케줄:
 * - 매 15분마다 fetch (수집 + 분류 + 응답 생성)
 * - 매 30분마다 approve (자동 승인)
 */

export interface Env {
  PAGES_URL: string      // Pages 앱 URL (예: https://autonomey.pages.dev)
  CRON_SECRET: string    // 인증용 시크릿 (Pages의 JWT_SECRET과 동일)
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cron = event.cron
    console.log(`Cron triggered: ${cron}`)

    const baseUrl = env.PAGES_URL || 'https://autonomey.pages.dev'

    try {
      // 매 15분: 댓글 수집 + 분류 + 응답 생성
      if (cron.includes('*/15') || cron === '0 * * * *') {
        console.log('Running fetch schedule...')
        const response = await fetch(`${baseUrl}/api/schedule/fetch`, {
          method: 'POST',
          headers: {
            'X-Cron-Secret': env.CRON_SECRET,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const error = await response.text()
          console.error(`Fetch failed: ${response.status} - ${error}`)
        } else {
          const result = await response.json()
          console.log('Fetch result:', result)
        }
      }

      // 매 30분: 자동 승인
      if (cron.includes('*/30')) {
        console.log('Running approve schedule...')
        const response = await fetch(`${baseUrl}/api/schedule/approve`, {
          method: 'POST',
          headers: {
            'X-Cron-Secret': env.CRON_SECRET,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          const error = await response.text()
          console.error(`Approve failed: ${response.status} - ${error}`)
        } else {
          const result = await response.json()
          console.log('Approve result:', result)
        }
      }
    } catch (error) {
      console.error('Cron error:', error)
    }
  },

  // 테스트용 HTTP 핸들러
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        pagesUrl: env.PAGES_URL,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 수동 트리거 (테스트용)
    if (url.pathname === '/trigger/fetch') {
      const baseUrl = env.PAGES_URL || 'https://autonomey.pages.dev'
      const response = await fetch(`${baseUrl}/api/schedule/fetch`, {
        method: 'POST',
        headers: {
          'X-Cron-Secret': env.CRON_SECRET,
          'Content-Type': 'application/json'
        }
      })
      return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (url.pathname === '/trigger/approve') {
      const baseUrl = env.PAGES_URL || 'https://autonomey.pages.dev'
      const response = await fetch(`${baseUrl}/api/schedule/approve`, {
        method: 'POST',
        headers: {
          'X-Cron-Secret': env.CRON_SECRET,
          'Content-Type': 'application/json'
        }
      })
      return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response('Autonomey Cron Worker', { status: 200 })
  }
}
