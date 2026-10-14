import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

const MATH_REPLACEMENTS: [RegExp, string][] = [
  [/\\rightarrow/g, '→'],
  [/\\Rightarrow/g, '⇒'],
  [/\\leftarrow/g, '←'],
  [/\\Leftarrow/g, '⇐'],
  [/\\leftrightarrow/g, '↔'],
  [/\\Leftrightarrow/g, '⇔'],
  [/\\mapsto/g, '↦'],
  [/\\implies/g, '⟹'],
  [/\\iff/g, '⟺'],
  [/\\cdot/g, '·'],
  [/\\times/g, '×'],
  [/\\div/g, '÷'],
  [/\\pm/g, '±'],
  [/\\mp/g, '∓'],
  [/\\leq/g, '≤'],
  [/\\geq/g, '≥'],
  [/\\neq/g, '≠'],
  [/\\approx/g, '≈'],
  [/\\equiv/g, '≡'],
  [/\\subset/g, '⊂'],
  [/\\supset/g, '⊃'],
  [/\\subseteq/g, '⊆'],
  [/\\supseteq/g, '⊇'],
  [/\\cap/g, '∩'],
  [/\\cup/g, '∪'],
  [/\\emptyset/g, '∅'],
  [/\\infty/g, '∞'],
  [/\\nabla/g, '∇'],
  [/\\partial/g, '∂'],
  [/\\alpha/gi, 'α'],
  [/\\beta/gi, 'β'],
  [/\\gamma/gi, 'γ'],
  [/\\delta/gi, 'δ'],
  [/\\epsilon/gi, 'ε'],
  [/\\zeta/gi, 'ζ'],
  [/\\eta/gi, 'η'],
  [/\\theta/gi, 'θ'],
  [/\\iota/gi, 'ι'],
  [/\\kappa/gi, 'κ'],
  [/\\lambda/gi, 'λ'],
  [/\\mu/gi, 'μ'],
  [/\\nu/gi, 'ν'],
  [/\\xi/gi, 'ξ'],
  [/\\pi/gi, 'π'],
  [/\\rho/gi, 'ρ'],
  [/\\sigma/gi, 'σ'],
  [/\\tau/gi, 'τ'],
  [/\\upsilon/gi, 'υ'],
  [/\\phi/gi, 'φ'],
  [/\\chi/gi, 'χ'],
  [/\\psi/gi, 'ψ'],
  [/\\omega/gi, 'ω'],
]

const BOX_DRAWING_RE = /[\u2500-\u257F]/

function hasBoxDrawing(text: string): boolean {
  return BOX_DRAWING_RE.test(text)
}

function preprocessMath(text: string): string {
  let result = text

  // Handle $$...$$ block math
  result = result.replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
    const processed = processInlineMath(expr.trim())
    return `<div class="math-block">${processed}</div>`
  })

  // Handle $...$ inline math
  result = result.replace(/\$(.+?)\$/g, (_, expr) => {
    const processed = processInlineMath(expr.trim())
    return `<span class="math-inline">${processed}</span>`
  })

  if (!hasBoxDrawing(result)) {
    return result
  }

  const paragraphs = result.split(/\n\n+/)
  const processed = paragraphs.map(p => {
    if (hasBoxDrawing(p)) {
      return '```\n' + p + '\n```'
    }
    return p
  })
  return processed.join('\n\n')
}

function processInlineMath(expr: string): string {
  let result = expr
  for (const [pattern, replacement] of MATH_REPLACEMENTS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

export default function MarkdownContent({ content }: { content: string }) {
  const processedContent = preprocessMath(content)

  return (
    <>
      {/* NOTE: inline <style> kept intentionally for scoped math styles.
          Prefer moving to a CSS file (e.g. MarkdownContent.css) if this grows. */}
      <style>{`
        .math-inline {
          font-family: 'Times New Roman', serif;
          font-style: italic;
          padding: 0 0.15em;
        }
        .math-block {
          font-family: 'Times New Roman', serif;
          font-style: italic;
          text-align: center;
          padding: 0.75em 0;
          margin: 0.5em 0;
          background: var(--apple-accent);
          opacity: 0.04;
          border-radius: 0.5rem;
        }
      `}</style>
      <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-a:no-underline hover:prose-a:underline prose-code:before:content-none prose-code:after:content-none overflow-x-auto" style={{
        '--tw-prose-body': 'var(--apple-text)',
        '--tw-prose-headings': 'var(--apple-text)',
        '--tw-prose-links': 'var(--apple-accent)',
        '--tw-prose-bold': 'var(--apple-text)',
        '--tw-prose-counters': 'var(--apple-text-secondary)',
        '--tw-prose-bullets': 'var(--apple-text-secondary)',
        '--tw-prose-hr': 'var(--apple-border)',
        '--tw-prose-quotes': 'var(--apple-text-secondary)',
        '--tw-prose-quote-borders': 'var(--apple-border)',
        '--tw-prose-code': 'var(--apple-text)',
        '--tw-prose-th-borders': 'var(--apple-border)',
        '--tw-prose-td-borders': 'var(--apple-border)',
      } as React.CSSProperties}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: ({ href, children, ...props }) => {
            const isSafe = !href || /^(https?:|mailto:|#|\/)/i.test(href)
            if (!isSafe) return <span>{children}</span>
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto rounded-lg border border-apple-border">
              <table className="min-w-full text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-apple-surface font-semibold text-left text-apple-text border-b border-apple-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-apple-border text-apple-text-secondary">
              {children}
            </td>
          ),
          img: ({ src, alt }) => {
            if (!src || /^(javascript:|data:text)/i.test(src)) return <span>{alt || ''}</span>
            // Only allow http/https, data:image, or relative URLs
            if (!/^(https?:|data:image|\/|#)/i.test(src) && !/^[^:/?#]+(?:[/?#]|$)/.test(src)) {
              return <span>{alt || ''}</span>
            }
            return <img src={src} alt={alt || ''} className="rounded-lg max-w-full h-auto" loading="lazy" />
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-apple-accent/30 bg-apple-accent/5 pl-4 pr-4 py-2 rounded-r-lg italic not-italic">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-apple-border my-6" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
    </>
  )
}
