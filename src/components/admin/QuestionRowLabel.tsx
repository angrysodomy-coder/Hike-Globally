'use client'

import { createRowLabel } from './createRowLabel'

/** For FAQ arrays on trips, destinations and the FAQ block. */
export const QuestionRowLabel = createRowLabel<{ question?: string }>('Question', (data) => {
  const question = data?.question?.trim()
  if (!question) return null
  return question.length > 80 ? `${question.slice(0, 80)}…` : question
})
