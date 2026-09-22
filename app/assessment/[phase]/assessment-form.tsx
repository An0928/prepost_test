'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { submitAssessment, type AssessmentItem } from '../actions'

type Judgment = 'real' | 'fake' | 'unsure'
type Answer = { judgment?: Judgment; reason: string }

export default function AssessmentForm({ phase, items }: { phase: 'pretest' | 'posttest'; items: AssessmentItem[] }) {
  const searchParams = useSearchParams()
  const language = searchParams.get('lang') === 'en' ? 'en' : 'zh'
  const [studentId, setStudentId] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [incompleteItemId, setIncompleteItemId] = useState<string | null>(null)
  const completed = items.filter((item) => answers[item.id]?.judgment && answers[item.id]?.reason.trim()).length
  const judgmentOptions: [Judgment, string][] = language === 'en' ? [['real', 'True'], ['fake', 'Suspicious'], ['unsure', 'Unsure']] : [['real', '真實'], ['fake', '可疑'], ['unsure', '不確定']]
  const setAnswer = (id: string, patch: Partial<Answer>) => {
    setAnswers((current) => ({ ...current, [id]: { reason: current[id]?.reason ?? '', ...current[id], ...patch } }))
    if (incompleteItemId === id) setIncompleteItemId(null)
  }

  async function submit() {
    setError('')
    if (!studentId.trim()) { setError(language === 'en' ? 'Please enter your student ID' : '請填寫學號'); document.getElementById('student-id')?.focus(); return }
    if (completed !== items.length) {
      const firstIncomplete = items.find((item) => !answers[item.id]?.judgment || !answers[item.id]?.reason.trim())
      if (firstIncomplete) {
        setIncompleteItemId(firstIncomplete.id)
        document.getElementById(`item-${firstIncomplete.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      setError(language === 'en' ? 'Please complete all items and provide your reasoning' : '請完成所有題目與理由')
      return
    }
    const result = await submitAssessment({ studentId, phase, language, answers: items.map((item) => ({ itemId: item.id, judgment: answers[item.id].judgment, reason: answers[item.id].reason })) })
    if (!result.ok) { setError(result.error); return }
    setDone(true)
  }

  if (done) return <main className="mx-auto flex min-h-screen max-w-[480px] items-center px-5"><section className="w-full rounded-3xl bg-card p-8 text-center shadow-sm"><p className="font-mono text-xs uppercase tracking-[.2em] text-primary">Thank you</p><h1 className="mt-4 font-serif text-3xl font-bold">{language === 'en' ? 'Thank You for Your Participation' : '感謝您的參與'}</h1><p className="mt-4 text-[15px] leading-7 text-muted-foreground">{language === 'en' ? 'This assessment is complete. Your responses will help this research understand media literacy learning outcomes.' : '本次測驗已完成，您的回覆將協助研究了解媒體識讀學習成效。'}</p></section></main>

  return <main className="mx-auto max-w-[480px] px-5 pb-10"><header className="pb-7 pt-10"><p className="font-mono text-xs tracking-[.18em] text-primary"></p><h1 className="mt-4 font-serif text-4xl font-bold leading-tight">{language === 'en' ? 'Media Literacy Assessment' : '媒體識讀問卷'}<br /></h1><p className="mt-4 text-[15px] text-muted-foreground">{phase === 'pretest' ? (language === 'en' ? 'Pretest' : '前測問卷') : (language === 'en' ? 'Posttest' : '後測問卷')}{language === 'en' ? ' · Please answer based on your genuine judgment' : ' · 請依照真實想法作答'}</p><label className="mt-8 block text-[15px] font-semibold" htmlFor="student-id">{language === 'en' ? 'Student ID' : '學號'} <span className="text-destructive">*</span></label><input id="student-id" value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-2 h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus:ring-2 focus:ring-primary" placeholder={language === 'en' ? 'Enter your student ID' : '請輸入學號'} />{error && <p role="alert" className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-[15px] text-destructive">{error}</p>}</header><section className="space-y-5">{items.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-[15px] text-muted-foreground">{language === 'en' ? 'No items available yet' : '目前尚無題目'}</div> : items.map((item) => { const answer = answers[item.id]; const username = item.username_en && language === 'en' ? item.username_en : item.username; const caption = item.caption_en && language === 'en' ? item.caption_en : item.caption; const imageUrl = item.image_url_en && language === 'en' ? item.image_url_en : item.image_url; return <article key={item.id} id={`item-${item.id}`} className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${answer?.judgment && answer.reason.trim() ? 'border-primary' : ''} ${incompleteItemId === item.id ? 'border-destructive border-2' : ''}`}><div className="p-4"><div className="flex items-center gap-3"><span className="h-9 w-9 rounded-full" style={{ backgroundColor: item.avatar_color || '#cbd5d1' }} /><div><p className="font-semibold">{username || (language === 'en' ? 'Anonymous Account' : '匿名帳號')}</p><p className="text-xs text-muted-foreground">{item.handle || 'media-literacy'}</p></div></div></div>{imageUrl ? <img src={imageUrl} alt={language === 'en' ? 'Post Image' : '貼文圖片'} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-muted text-[15px] text-muted-foreground">{language === 'en' ? 'No Image' : '無圖片'}</div>}<div className="space-y-4 p-4"><p className="text-[15px] leading-6 whitespace-pre-line">{caption.replace(/\\n/g, "\n")}</p><div className="grid grid-cols-3 gap-2">{judgmentOptions.map(([value, label]) => <button key={value} type="button" onClick={() => setAnswer(item.id, { judgment: value })} className={`min-h-11 rounded-xl border text-[15px] ${answer?.judgment === value ? 'border-primary bg-primary/10 font-semibold' : 'bg-background'}`}>{label}</button>)}</div><textarea value={answer?.reason ?? ''} onChange={(event) => setAnswer(item.id, { reason: event.target.value })} className="min-h-24 w-full resize-none rounded-xl border bg-background p-3 text-[15px] leading-6 outline-none focus:ring-2 focus:ring-primary" placeholder={language === 'en' ? 'Write your reasoning here' : '請寫下你的判斷理由'} /></div></article> })}</section><div className="mt-8 flex justify-center"><button type="button" onClick={submit} className="min-h-14 min-w-28 rounded-[14px] bg-primary px-5 font-bold text-primary-foreground">{language === 'en' ? 'Submit' : '提交'}</button></div></main>
}
