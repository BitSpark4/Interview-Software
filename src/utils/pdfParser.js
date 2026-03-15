import * as pdfjsLib from 'pdfjs-dist'

// Point at the bundled worker — Vite resolves this via new URL()
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

/**
 * Extract plain text from a PDF File object.
 * Runs entirely in the browser — no server needed.
 * Returns the concatenated text of all pages (trimmed).
 */
export async function parsePdf(file) {
  const arrayBuffer = await file.arrayBuffer()

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  const pageTexts = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page        = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText    = textContent.items
      .map(item => ('str' in item ? item.str : ''))
      .join(' ')
    pageTexts.push(pageText)
  }

  const fullText = pageTexts.join('\n').replace(/\s+/g, ' ').trim()

  if (!fullText) {
    throw new Error(
      'Could not extract text from this PDF. It may be scanned/image-based. Please try a text-based PDF.'
    )
  }

  return fullText
}
