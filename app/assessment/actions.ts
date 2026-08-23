'use server'

import mysql from 'mysql2/promise'
import { z } from 'zod'

export type AssessmentItem = {
  id: string
  phase: 'pretest' | 'posttest'
  order_index: number
  username: string | null
  handle: string | null
  avatar_color: string | null
  image_url: string | null
  caption: string | null
  likes: number | null
}

const answerSchema = z.object({
  studentId: z.string().trim().min(1),
  phase: z.enum(['pretest', 'posttest']),
  answers: z.array(z.object({ itemId: z.string().min(1), judgment: z.enum(['real', 'fake', 'unsure']), reason: z.string().trim().min(1) })).min(1),
})

function connection() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  return mysql.createConnection(url)
}

const testItems: AssessmentItem[] = [
  { id: 'test-1', phase: 'pretest', order_index: 1, username: '城市觀察日誌', handle: '@city_notes', avatar_color: '#d8a48f', image_url: null, caption: '市府宣布下週起公車票價全面調降，轉發前請先確認消息來源。', likes: 128 },
  { id: 'test-2', phase: 'pretest', order_index: 2, username: '每日健康', handle: '@daily_health', avatar_color: '#8ba897', image_url: null, caption: '研究顯示，睡前滑手機會讓所有人的睡眠品質下降 70%。', likes: 86 },
  { id: 'test-3', phase: 'pretest', order_index: 3, username: '校園即時報', handle: '@campus_now', avatar_color: '#9bb8d3', image_url: null, caption: '校方公告提醒：本週五因設備檢修，圖書館將提前於下午五點閉館。', likes: 214 },
  { id: 'test-4', phase: 'pretest', order_index: 4, username: '科學小知識', handle: '@science_bits', avatar_color: '#c9a6cf', image_url: null, caption: '專家表示，所有標示「天然」的產品都一定比人工成分更安全。', likes: 63 },
]

export async function getAssessmentItems(phase: 'pretest' | 'posttest') {
  try {
    const db = await connection()
    try {
      const [rows] = await db.execute(
        'SELECT id, phase, order_index, username, handle, avatar_color, image_url, caption, likes FROM assessment_items WHERE phase = ? ORDER BY order_index',
        [phase],
      )
      const items = rows as AssessmentItem[]
      return items.length ? items : testItems.map(item => ({ ...item, phase }))
    } finally { await db.end() }
  } catch (error) {
    console.warn('[v0] Using test assessment items because MySQL is unavailable:', error)
    return testItems.map(item => ({ ...item, phase }))
  }
}

export async function submitAssessment(input: unknown) {
  const data = answerSchema.parse(input)
  const db = await connection()
  try {
    await db.beginTransaction()
    const [existing] = await db.execute('SELECT id FROM assessment_submissions WHERE student_id = ? AND phase = ? LIMIT 1', [data.studentId, data.phase])
    if ((existing as unknown[]).length) { await db.rollback(); return { ok: false as const, error: '此學號已完成過本次測驗，如有疑問請聯絡研究人員' } }
    for (const answer of data.answers) {
      await db.execute('INSERT INTO assessment_submissions (student_id, phase, item_id, judgment, reason) VALUES (?, ?, ?, ?, ?)', [data.studentId, data.phase, answer.itemId, answer.judgment, answer.reason])
    }
    await db.commit()
    return { ok: true as const }
  } catch (error) {
    await db.rollback()
    if (error instanceof Error && /doesn't exist|does not exist|ER_NO_SUCH_TABLE/i.test(error.message)) {
      console.warn('[v0] Test submission accepted without persistence because the schema is not installed.')
      return { ok: true as const, testMode: true as const }
    }
    throw error
  } finally { await db.end() }
}

export type SubmissionResult = Awaited<ReturnType<typeof submitAssessment>>

