/**
 * Strip any question-number prefix from generated question text.
 * Acts as a safety net in case the AI ignores the prompt instruction.
 * Examples stripped: "Question 3 of 10: ...", "Q2: ...", "3. ...", "3) ..."
 */
export function cleanQuestionText(text) {
  if (!text) return ''
  return text
    .replace(/^Question\s+\d+\s+of\s+\d+\s*[:\-]\s*/i, '')
    .replace(/^Question\s+\d+\s*[:\-]\s*/i, '')
    .replace(/^Q\d+\s*[:\-]\s*/i, '')
    .replace(/^\d+[.)]\s+/, '')
    .trim()
}
