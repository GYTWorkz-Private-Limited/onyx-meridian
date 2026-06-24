import React, { useEffect, useRef, useState, useMemo } from 'react'
import { forceSimulation, forceManyBody, forceLink, forceX, forceY, forceCollide } from 'd3-force'
import { Search, Plus, Minus, Crosshair, Maximize2 } from 'lucide-react'
import { knowledgeGraph, KG_CATEGORIES } from '../data/store.js'
import { Pill } from './ui.jsx'

const CAT = Object.fromEntries(KG_CATEGORIES.map((c) => [c.key, c]))

export default function KnowledgeGraph() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const stateRef = useRef({ t: { x: 0, y: 0, k: 0.7 }, drag: null, hover: null })
  const [size, setSize] = useState({ w: 900, h: 560 })
  const [ready, setReady] = useState(false)
  const [selected, setSelected] = useState(null)
  const [hidden, setHidden] = useState(() => new Set())
  const [query, setQuery] = useState('')

  // build graph copy with mutable positions
  const graph = useMemo(() => {
    const nodes = knowledgeGraph.nodes.map((n) => ({ ...n }))
    const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]))
    const links = knowledgeGraph.links.map((l) => ({ source: idx[l.source], target: idx[l.target], kind: l.kind }))
    // adjacency for highlight
    const adj = nodes.map(() => new Set())
    links.forEach((l) => { adj[l.source].add(l.target); adj[l.target].add(l.source) })
    return { nodes, links, adj, idx }
  }, [])

  const radius = (n) => 3 + Math.min(9, Math.sqrt(n.deg) * 1.6) + (n.cat === 'department' ? 6 : n.cat === 'organization' ? 10 : 0)

  // run layout once
  useEffect(() => {
    const { nodes, links } = graph
    const sim = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-46).distanceMax(420))
      .force('link', forceLink(links).distance((l) => (l.kind === 'contains' || l.kind === 'has-unit' ? 60 : 34)).strength(0.16))
      .force('x', forceX(0).strength(0.045))
      .force('y', forceY(0).strength(0.045))
      .force('collide', forceCollide().radius((n) => radius(n) + 2.5).iterations(2))
      .stop()
    const N = 280
    for (let i = 0; i < N; i++) sim.tick()
    // center transform on content bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    nodes.forEach((n) => { minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x); minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y) })
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2
    nodes.forEach((n) => { n.x -= cx; n.y -= cy })
    setReady(true)
  }, [graph])

  // resize
  useEffect(() => {
    const el = wrapRef.current
    const ro = new ResizeObserver(() => { if (el) setSize({ w: el.clientWidth, h: el.clientHeight }) })
    ro.observe(el); setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  // draw
  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const { w, h } = size
    canvas.width = w * dpr; canvas.height = h * dpr
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    const { t, hover } = stateRef.current
    ctx.save()
    ctx.translate(w / 2 + t.x, h / 2 + t.y)
    ctx.scale(t.k, t.k)

    const { nodes, links, adj } = graph
    const sel = selected != null ? selected : hover
    const neigh = sel != null ? adj[sel] : null
    const vis = (i) => !hidden.has(nodes[i].cat)

    // edges
    ctx.lineWidth = 0.6 / t.k
    links.forEach((l) => {
      if (!vis(l.source) || !vis(l.target)) return
      const a = nodes[l.source], b = nodes[l.target]
      const active = sel != null && (l.source === sel || l.target === sel)
      ctx.strokeStyle = active ? 'rgba(37,99,235,.55)' : sel != null ? 'rgba(150,160,180,.06)' : 'rgba(150,165,190,.16)'
      ctx.lineWidth = (active ? 1.4 : 0.6) / t.k
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    })

    // nodes
    nodes.forEach((n, i) => {
      if (!vis(i)) return
      const r = radius(n)
      const dim = sel != null && i !== sel && !(neigh && neigh.has(i))
      ctx.globalAlpha = dim ? 0.18 : 1
      const c = (CAT[n.cat] || {}).color || '#94a3b8'
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = c; ctx.fill()
      if (i === sel) { ctx.lineWidth = 2.5 / t.k; ctx.strokeStyle = '#0c1424'; ctx.stroke() }
      else if (n.cat === 'department' || n.cat === 'organization') { ctx.lineWidth = 1.5 / t.k; ctx.strokeStyle = '#fff'; ctx.stroke() }
      // labels for big nodes / hovered neighborhood
      const showLabel = n.cat === 'organization' || n.cat === 'department' || i === sel || (neigh && neigh.has(i) && t.k > 0.6) || (t.k > 1.7 && !dim)
      if (showLabel) {
        ctx.globalAlpha = dim ? 0.25 : 1
        ctx.fillStyle = '#23324a'
        ctx.font = `${(n.cat === 'department' ? 12 : 10) / t.k}px Inter, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillText(n.label, n.x, n.y - r - 3 / t.k)
      }
    })
    ctx.globalAlpha = 1
    ctx.restore()
  }

  useEffect(() => { if (ready) draw() })

  // interactions ------------------------------------------------------------
  const toWorld = (px, py) => {
    const { t } = stateRef.current
    return { x: (px - size.w / 2 - t.x) / t.k, y: (py - size.h / 2 - t.y) / t.k }
  }
  const hit = (px, py) => {
    const { nodes } = graph
    const p = toWorld(px, py)
    let best = null, bd = 1e9
    for (let i = 0; i < nodes.length; i++) {
      if (hidden.has(nodes[i].cat)) continue
      const dx = nodes[i].x - p.x, dy = nodes[i].y - p.y
      const d = dx * dx + dy * dy
      const rr = (radius(nodes[i]) + 4) ** 2
      if (d < rr && d < bd) { bd = d; best = i }
    }
    return best
  }
  const onMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const st = stateRef.current
    if (st.drag) {
      st.t.x = st.drag.tx + (px - st.drag.px)
      st.t.y = st.drag.ty + (py - st.drag.py)
      draw(); return
    }
    const h = hit(px, py)
    if (h !== st.hover) { st.hover = h; canvasRef.current.style.cursor = h != null ? 'pointer' : 'grab'; draw() }
  }
  const onDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const h = hit(px, py)
    if (h != null) { setSelected(h === selected ? null : h); return }
    stateRef.current.drag = { px, py, tx: stateRef.current.t.x, ty: stateRef.current.t.y }
  }
  const onUp = () => { stateRef.current.drag = null }
  const onWheel = (e) => {
    e.preventDefault()
    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    const st = stateRef.current
    const factor = Math.exp(-e.deltaY * 0.0012)
    const nk = Math.max(0.25, Math.min(4, st.t.k * factor))
    // zoom around cursor
    const wx = (px - size.w / 2 - st.t.x) / st.t.k
    const wy = (py - size.h / 2 - st.t.y) / st.t.k
    st.t.x = px - size.w / 2 - wx * nk
    st.t.y = py - size.h / 2 - wy * nk
    st.t.k = nk
    draw()
  }
  const zoomBtn = (dir) => {
    const st = stateRef.current
    st.t.k = Math.max(0.25, Math.min(4, st.t.k * (dir > 0 ? 1.25 : 0.8)))
    draw()
  }
  const reset = () => { stateRef.current.t = { x: 0, y: 0, k: 0.7 }; setSelected(null); draw() }
  const center = (i) => {
    const n = graph.nodes[i]; const st = stateRef.current
    st.t.k = 1.6; st.t.x = -n.x * st.t.k; st.t.y = -n.y * st.t.k
    setSelected(i); draw()
  }

  const toggleCat = (k) => setHidden((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })
  useEffect(() => { if (ready) draw() }, [hidden, selected])

  const onSearch = (e) => {
    setQuery(e.target.value)
    const q = e.target.value.trim().toLowerCase()
    if (q.length < 2) return
    const i = graph.nodes.findIndex((n) => n.label.toLowerCase().includes(q))
    if (i >= 0) center(i)
  }

  const sel = selected != null ? graph.nodes[selected] : null
  const selNeighbors = selected != null ? [...graph.adj[selected]].slice(0, 8).map((i) => graph.nodes[i]) : []

  return (
    <div className="graph-shell" ref={wrapRef} style={{ height: 600 }}>
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseDown={onDown} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel} />
      {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>Laying out {knowledgeGraph.nodes.length} nodes…</div>}

      <div className="graph-overlay">
        <div className="glass" style={{ padding: 10, display: 'flex', alignItems: 'center', gap: 8, height: 'fit-content' }}>
          <Search size={15} style={{ color: 'var(--muted)' }} />
          <input value={query} onChange={onSearch} placeholder="Find a node…" style={{ border: 0, outline: 'none', background: 'none', fontSize: 13, width: 150 }} />
        </div>
        <div className="zoom-ctl glass">
          <button onClick={() => zoomBtn(1)} title="Zoom in"><Plus size={16} /></button>
          <button onClick={() => zoomBtn(-1)} title="Zoom out"><Minus size={16} /></button>
          <button onClick={reset} title="Reset"><Maximize2 size={15} /></button>
        </div>
      </div>

      {/* legend */}
      <div className="glass" style={{ position: 'absolute', left: 14, bottom: 14, padding: 9, maxWidth: 240, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {KG_CATEGORIES.map((c) => (
          <div key={c.key} className={'legend-chip' + (hidden.has(c.key) ? ' off' : '')} onClick={() => toggleCat(c.key)}>
            <span className="sw" style={{ background: c.color, borderRadius: '50%' }} />{c.label}
          </div>
        ))}
      </div>

      {sel && (
        <div className="node-card glass">
          <div className="row" style={{ gap: 9 }}>
            <span className="sw" style={{ background: (CAT[sel.cat] || {}).color, width: 14, height: 14, borderRadius: '50%' }} />
            <Pill tone="blue">{(CAT[sel.cat] || {}).label}</Pill>
          </div>
          <h3 style={{ marginTop: 10 }}>{sel.label}</h3>
          <div className="crumb">{sel.deg} relationship{sel.deg === 1 ? '' : 's'} · degree centrality</div>
          <div className="section-title" style={{ margin: '12px 0 6px' }}>Connected to</div>
          <div className="tags">
            {selNeighbors.map((n, i) => (
              <span key={i} className="tag" onClick={() => center(graph.idx[n.id])} style={{ cursor: 'pointer' }}>{n.label}</span>
            ))}
          </div>
          <button className="btn sm" style={{ marginTop: 12 }} onClick={() => setSelected(null)}><Crosshair size={14} /> Clear</button>
        </div>
      )}
    </div>
  )
}
