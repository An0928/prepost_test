import { notFound } from 'next/navigation'
import { getAssessmentItems } from '../actions'
import AssessmentForm from './assessment-form'

export default async function AssessmentPage({ params }: { params: Promise<{ phase: string }> }) {
  const { phase } = await params
  if (phase !== 'pretest' && phase !== 'posttest') notFound()
  const items = await getAssessmentItems(phase)
  return <AssessmentForm phase={phase} items={items} />
}
