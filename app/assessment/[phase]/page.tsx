import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getAssessmentItems } from '../actions'
import AssessmentForm from './assessment-form'

export default async function AssessmentPage({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params
  if (phase !== 'pretest' && phase !== 'posttest') notFound()
  const items = await getAssessmentItems(phase)
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-screen max-w-[480px] items-center justify-center px-5 text-[15px] text-muted-foreground">Loading…</div>}>
      <AssessmentForm phase={phase} items={items} />
    </Suspense>
  )
}
