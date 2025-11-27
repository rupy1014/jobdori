/**
 * OpenRouter API 서비스
 * - 댓글 분류
 * - 응답 생성
 */

import type { Env, StoredComment, Settings, CommentType, Attitude } from '../types'
import { postReply } from './youtube'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// 모델 설정
const MODEL_CLASSIFY = 'openai/gpt-4o-mini'            // 분류용 (저렴 + 한국어 우수)
const MODEL_REPLY = 'google/gemini-2.0-flash-001'      // 응답 생성용 (품질)



interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

/**
 * OpenRouter API 호출
 */
async function callLLM(env: Env, model: string, systemPrompt: string, userMessage: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://youtube-reply-bot.workers.dev',
      'X-Title': 'YouTube Reply Bot'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`OpenRouter API error: ${response.statusText} - ${errorData}`)
  }

  const data = await response.json() as OpenRouterResponse
  return data.choices[0]?.message?.content || ''
}

/**
 * 댓글 분류하기
 */
export async function classifyComment(env: Env, text: string): Promise<{ type: CommentType }> {
  const systemPrompt = `당신은 YouTube 댓글을 분류하는 전문가입니다.
댓글을 다음 6가지 유형 중 하나로 분류해주세요:

- question: 질문 댓글 (궁금한 점, 정보 요청, 도움 요청)
- suggestion: 제안 댓글 (콘텐츠 요청, 개선점, 아이디어)
- negative: 부정적인 댓글 (비난, 악플, 불만)
- positive: 긍정적인 댓글 (칭찬, 응원, 감사)
- reaction: 단순 반응 (ㅋㅋ, 와, ㅎㅎ 등)
- other: 위 카테고리에 해당하지 않는 기타

## 분류 우선순위 (중요!)
댓글에 여러 의도가 섞여있으면 다음 우선순위로 분류:
1. question (질문이 하나라도 있으면 question)
2. suggestion (제안/요청이 있으면 suggestion)
3. negative (부정적 내용)
4. positive (긍정적 내용)
5. reaction/other

## 질문 판별 기준
다음 패턴이 포함되면 question으로 분류:
- 직접 질문: "~인가요?", "~할까요?", "~하나요?"
- 간접 질문: "~뭘까요?", "~뭔가요?", "~일까요?"
- 궁금 표현: "궁금", "알고싶", "어떻게"
- 물음표(?)가 있고 정보를 묻는 맥락

반드시 다음 JSON 형식으로만 응답하세요:
{"type": "분류결과"}

예시:
- "이 부분 어떻게 하는 건가요?" → {"type": "question"}
- "저 툴은 뭘까요?" → {"type": "question"}
- "잘 봤어요! 근데 이건 뭔가요?" → {"type": "question"} (질문 우선)
- "좋아요! 다음엔 이런 내용도 해주세요" → {"type": "suggestion"} (제안 우선)
- "다음엔 이런 주제 다뤄주세요" → {"type": "suggestion"}
- "영상 너무 좋아요! 응원합니다" → {"type": "positive"}
- "이게 뭐야 시간낭비" → {"type": "negative"}
- "ㅋㅋㅋㅋ" → {"type": "reaction"}
- "안녕하세요" → {"type": "other"}`

  const userMessage = `다음 댓글을 분류해주세요:\n\n"${text}"`

  const result = await callLLM(env, MODEL_CLASSIFY, systemPrompt, userMessage)

  try {
    // JSON 부분만 추출
    const jsonMatch = result.match(/\{[^}]+\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.type && ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other'].includes(parsed.type)) {
        return { type: parsed.type as CommentType }
      }
    }
  } catch {
    console.error('Failed to parse classification result:', result)
  }

  // 기본값
  return { type: 'other' }
}

/**
 * 애티튜드별 응답 프롬프트
 */
const ATTITUDE_PROMPTS: Record<Attitude, string> = {
  gratitude: `감사의 마음을 담아 응답합니다.
- 진심어린 감사 표현
- 따뜻하고 겸손한 태도
- 시청자의 응원에 힘입어 더 노력하겠다는 의지`,

  graceful: `품위있게 대처합니다.
- 절대 방어적이지 않게
- 비난에도 감사함 표현
- 건설적인 피드백으로 받아들이기
- 더 나은 콘텐츠를 만들겠다는 약속`,

  expert: `친절한 전문가로서 응답합니다.
- 정확하고 도움이 되는 정보 제공
- 쉬운 설명
- 추가 질문 환영하는 태도`,

  empathy: `공감하며 응답합니다.
- 제안에 대한 감사
- 시청자 의견 존중
- 검토하겠다는 열린 태도`,

  humor: `유머러스하게 응답합니다.
- 가볍고 재미있게
- 친근한 말투
- 이모지 활용 가능`,

  friendly: `친근하게 응답합니다.
- 따뜻하고 편안한 말투
- 자연스러운 대화체
- 시청자와 친구처럼`
}

/**
 * 유형별 지침 프롬프트 생성
 */
function getTypeInstructionPrompt(type: CommentType, settings: Settings): string {
  const typeInstruction = settings.typeInstructions?.[type]
  if (!typeInstruction?.instruction) {
    return ATTITUDE_PROMPTS[settings.attitudeMap?.[type] || 'friendly']
  }

  return `## 이 유형(${type})에 대한 추가 지침:\n${typeInstruction.instruction}`
}

/**
 * 댓글에 대한 응답 생성하기 (단일)
 */
export async function generateReplyForComment(
  env: Env,
  comment: StoredComment,
  settings: Settings
): Promise<string> {
  const type = comment.type || 'other'
  const attitude = comment.attitude || 'friendly'
  const attitudePrompt = ATTITUDE_PROMPTS[attitude]
  const typeInstructionPrompt = getTypeInstructionPrompt(type, settings)

  // 공통 지침 (없으면 기본값)
  const commonInstructions = settings.commonInstructions || settings.customInstructions || ''

  const systemPrompt = `당신은 "${settings.persona}" 유튜브 채널을 운영하는 크리에이터입니다.

말투: ${settings.tone}

## 공통 응답 지침:
${commonInstructions}

## 현재 댓글 유형: ${type}

${typeInstructionPrompt}`

  const userMessage = `영상 제목: ${comment.videoTitle}

댓글 내용:
"${comment.text}"

이 댓글에 대한 응답을 작성해주세요.`

  return await callLLM(env, MODEL_REPLY, systemPrompt, userMessage)
}

/**
 * 유형별 지침을 포함한 프롬프트 생성
 */
function buildTypeInstructionsPrompt(settings: Settings): string {
  if (!settings.typeInstructions) {
    return Object.entries(ATTITUDE_PROMPTS)
      .map(([key, value]) => `- ${key}: ${value.split('\n')[0]}`)
      .join('\n')
  }

  const types: CommentType[] = ['positive', 'negative', 'question', 'suggestion', 'reaction', 'other']
  return types.map(type => {
    const instruction = settings.typeInstructions[type]
    if (!instruction?.instruction) return `- ${type}: 기본 응답`
    return `- ${type}: ${instruction.instruction}`
  }).join('\n')
}

/**
 * 여러 댓글에 대한 응답을 한 번에 생성하기 (배치)
 * enabled가 false인 유형은 응답 생성에서 제외
 */
export async function generateRepliesForComments(
  env: Env,
  comments: StoredComment[],
  settings: Settings
): Promise<Map<string, string>> {
  if (comments.length === 0) {
    return new Map()
  }

  // enabled가 true인 댓글만 필터링
  const enabledComments = comments.filter(c => {
    const type = c.type || 'other'
    const typeInstruction = settings.typeInstructions?.[type]
    // typeInstructions가 없거나 enabled가 true인 경우 포함
    return !typeInstruction || typeInstruction.enabled !== false
  })

  if (enabledComments.length === 0) {
    return new Map()
  }

  // 댓글 목록을 JSON 형식으로 구성
  const commentsData = enabledComments.map((c, idx) => ({
    index: idx + 1,
    id: c.id,
    videoTitle: c.videoTitle,
    text: c.text,
    type: c.type,
    attitude: c.attitude
  }))

  const typeInstructionsPrompt = buildTypeInstructionsPrompt(settings)

  // 공통 지침 (없으면 기본값)
  const commonInstructions = settings.commonInstructions || settings.customInstructions || ''

  const systemPrompt = `당신은 "${settings.persona}" 유튜브 채널을 운영하는 크리에이터입니다.

말투: ${settings.tone}

## 공통 응답 지침:
${commonInstructions}

## 댓글 유형별 추가 지침:
${typeInstructionsPrompt}

반드시 다음 JSON 배열 형식으로만 응답하세요:
[
  {"id": "댓글ID1", "reply": "응답내용1"},
  {"id": "댓글ID2", "reply": "응답내용2"}
]`

  const userMessage = `다음 ${enabledComments.length}개의 댓글에 대해 각각 응답을 작성해주세요:

${JSON.stringify(commentsData, null, 2)}`

  const result = await callLLM(env, MODEL_REPLY, systemPrompt, userMessage)

  // JSON 파싱
  const replies = new Map<string, string>()
  try {
    // JSON 배열 추출
    const jsonMatch = result.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{ id: string; reply: string }>
      for (const item of parsed) {
        if (item.id && item.reply) {
          replies.set(item.id, item.reply)
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse batch replies:', error, result)
  }

  return replies
}

/**
 * YouTube에 댓글 게시
 */
export async function replyToComment(env: Env, commentId: string, text: string): Promise<void> {
  await postReply(env, commentId, text)
}
