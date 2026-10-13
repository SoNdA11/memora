import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GraphNode, GraphEdge } from '../types'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

interface SimNode extends GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  pinned: boolean
  radius: number
}

const W = 1200
const H = 800
const REPULSION = 6000
const ATTRACTION = 0.005
const DAMPING = 0.85
const CENTER = 0.01
const IDEAL_LENGTH = 180

const COLORS: Record<string, string> = {
  module: '#8b5cf6',
  subject: '#3b82f6',
  topic: '#10b981',
  theory: '#f59e0b',
}

const LABEL_COLORS: Record<string, string> = {
  module: '#c4b5fd',
  subject: '#93c5fd',
  topic: '#6ee7b7',
  theory: '#fde68a',
}

const RADII: Record<string, number> = {
  module: 12,
  subject: 9,
  topic: 6,
  theory: 5,
}

export default function KnowledgeGraph({ nodes: rawNodes, edges }: Props) {
  const navigate = useNavigate()
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number>(0)
  const [simNodes, setSimNodes] = useState<SimNode[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null)

  const nodeMap = useRef<Map<string, SimNode>>(new Map())

  useEffect(() => {
    const sn: SimNode[] = rawNodes.map((n) => ({
      ...n,
      x: Math.random() * W * 0.8 + W * 0.1,
      y: Math.random() * H * 0.8 + H * 0.1,
      vx: 0,
      vy: 0,
      pinned: false,
      radius: RADII[n.type] || 6,
    }))
    nodeMap.current = new Map(sn.map((n) => [n.id, n]))
    setSimNodes(sn)
  }, [rawNodes])

  useEffect(() => {
    if (simNodes.length === 0) return

    let running = true

    const simulate = () => {
      if (!running) return
      const nodes = nodeMap.current
      let maxMove = 0

      for (let iter = 0; iter < 5; iter++) {
        const vals = Array.from(nodes.values())

        for (const a of vals) {
          if (a.pinned) continue
          let fx = 0, fy = 0

          for (const b of vals) {
            if (a.id === b.id) continue
            const dx = a.x - b.x
            const dy = a.y - b.y
            const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
            const f = REPULSION / (d * d)
            fx += (dx / d) * f
            fy += (dy / d) * f
          }

          for (const edge of edges) {
            let other: SimNode | undefined
            if (edge.source === a.id) other = nodes.get(edge.target)
            if (edge.target === a.id) other = nodes.get(edge.source)
            if (!other) continue

            const dx = other.x - a.x
            const dy = other.y - a.y
            const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
            const f = (d - IDEAL_LENGTH) * ATTRACTION
            fx += (dx / d) * f
            fy += (dy / d) * f
          }

          const cx = W / 2 - a.x
          const cy = H / 2 - a.y
          fx += cx * CENTER
          fy += cy * CENTER

          a.vx = (a.vx + fx) * DAMPING
          a.vy = (a.vy + fy) * DAMPING
          a.x += a.vx
          a.y += a.vy

          const move = Math.abs(a.vx) + Math.abs(a.vy)
          if (move > maxMove) maxMove = move
        }
      }

      if (maxMove > 0.1) {
        rafRef.current = requestAnimationFrame(simulate)
      }
    }

    rafRef.current = requestAnimationFrame(simulate)

    return () => {
      running = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [simNodes.length, edges])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const sx = mx * scaleX
    const sy = my * scaleY

    const nodes = nodeMap.current
    let found: SimNode | null = null
    for (const n of nodes.values()) {
      const dx = n.x - sx
      const dy = n.y - sy
      if (dx * dx + dy * dy < (n.radius + 4) * (n.radius + 4)) {
        found = n
        break
      }
    }

    if (found) {
      setHovered(found.id)
      setTooltip({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 8, node: found })
      svg.style.cursor = 'pointer'
    } else {
      setHovered(null)
      setTooltip(null)
      svg.style.cursor = 'default'
    }
  }, [])

  const handleClick = useCallback(() => {
    const nodes = nodeMap.current
    if (!hovered) return
    const n = nodes.get(hovered)
    if (!n) return
    if (n.type === 'theory' && n.theory_id) {
      navigate(`/theory/${n.theory_id}`)
    }
  }, [hovered, navigate])

  const nodes = nodeMap.current

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-apple-border bg-apple-surface">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto aspect-[3/2] min-h-[320px] max-h-[75vh] touch-pan-y"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        <defs>
          {rawNodes.map((n) => (
            <filter key={n.id} id={`glow-${n.id}`}>
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {edges.map((e, i) => {
          const a = nodes.get(e.source)
          const b = nodes.get(e.target)
          if (!a || !b) return null
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={hovered === e.source || hovered === e.target ? '#6366f1' : '#334155'}
              strokeWidth={hovered === e.source || hovered === e.target ? 2 : 0.8}
              opacity={hovered === e.source || hovered === e.target ? 0.8 : 0.3}
              className="transition-all duration-200"
            />
          )
        })}

        {rawNodes.map((n) => {
          const sn = nodes.get(n.id)
          if (!sn) return null
          const isHover = hovered === n.id
          return (
            <g key={n.id} filter={isHover ? `url(#glow-${n.id})` : undefined}>
              <circle
                cx={sn.x}
                cy={sn.y}
                r={isHover ? sn.radius + 3 : sn.radius}
                fill={COLORS[n.type] || '#6366f1'}
                opacity={isHover ? 1 : hovered ? 0.4 : 0.8}
                className="transition-all duration-200"
              />
              {n.type !== 'topic' && n.type !== 'theory' && (
                <text
                  x={sn.x}
                  y={sn.y + sn.radius + 12}
                  textAnchor="middle"
                  fill={LABEL_COLORS[n.type] || '#94a3b8'}
                  fontSize={n.type === 'module' ? 11 : 9}
                  fontWeight={n.type === 'module' ? 'bold' : 'normal'}
                  opacity={isHover ? 1 : hovered ? 0.5 : 0.8}
                  className="pointer-events-none select-none"
                >
                  {n.label.length > 25 ? n.label.substring(0, 24) + '…' : n.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {tooltip && (
        <div
          className="absolute z-10 pointer-events-none bg-apple-surface/90 text-apple-text text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold">{tooltip.node.label}</p>
          {tooltip.node.code && <p className="text-apple-text-secondary mt-0.5">{tooltip.node.code}</p>}
          {tooltip.node.subject && tooltip.node.type !== 'subject' && (
            <p className="text-apple-text-secondary mt-0.5">{tooltip.node.subject}</p>
          )}
          {tooltip.node.type === 'theory' && (
            <p className="text-apple-accent mt-0.5">Clique para abrir</p>
          )}
        </div>
      )}
    </div>
  )
}
