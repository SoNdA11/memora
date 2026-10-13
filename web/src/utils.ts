export function cleanPastedText(text: string): string {
  let t = text.replace(/\r\n/g, '\n')

  t = t.replace(/(\w+)-\n(\w+)/g, (_, a, b) => a + b)

  const paragraphs = t.split(/\n\n+/)
  const cleaned = paragraphs.map((p) => {
    const lines = p.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length <= 1) return lines.join(' ')
    const joined: string[] = [lines[0]]
    for (let i = 1; i < lines.length; i++) {
      const prev = joined[joined.length - 1]
      const curr = lines[i]
      const endsWithTerminator = /[.!?)]$/.test(prev)
      const isAltLine = /^[\(]?[a-e]\s*[\)\.\:\-]/.test(curr)
      const startsWithLower = /^[a-zà-úa-z0-9(]/.test(curr) && !isAltLine
      if (!endsWithTerminator && startsWithLower) {
        joined[joined.length - 1] = prev + ' ' + curr
      } else {
        joined.push(curr)
      }
    }
    return joined.join('\n')
  })

  return cleaned
    .join('\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

const ALT_PATTERN = /^[\(]?([A-Ea-e])\s*[\)\.\:\-]+\s*(.+)$/

export function parseAlternatives(
  text: string
): { questionText: string; alternatives: { letter: string; text: string }[] } {
  const lines = text.split('\n')
  const altLines: { lineIndex: number; letter: string; text: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    const match = trimmed.match(ALT_PATTERN)
    if (match) {
      altLines.push({ lineIndex: i, letter: match[1], text: match[2].trim() })
    }
  }

  if (altLines.length < 2) {
    return { questionText: text, alternatives: [] }
  }

  const firstAltIndex = altLines[0].lineIndex
  const questionText = lines.slice(0, firstAltIndex).join('\n').trim()

  const alternatives = altLines.map((a) => ({ letter: a.letter.toUpperCase(), text: a.text }))

  return { questionText, alternatives }
}
