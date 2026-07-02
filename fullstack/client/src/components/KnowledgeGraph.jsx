import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import {
  Search, X, FileText, Video, AudioLines, ExternalLink, ArrowRight, ArrowLeft,
  Sparkles, Send, MessageSquare, RotateCcw
} from 'lucide-react';

// Unstructured knowledge-source categories vs. structured ontology entities.
const SOURCE_CATS = new Set(['Document', 'Video', 'Audio']);
const SOURCE_ICON = { Document: FileText, Video: Video, Audio: AudioLines };

// Vibrant palette tuned to read on the near-black (#0a0a0b) canvas.
const COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
  '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8',
  '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185',
];

const BG = '#0a0a0b';

// Soft radial-gradient sprite used as a glow halo behind every node — gives the
// orbs the luminous "knowledge sphere" look instead of flat shaded balls.
let _glowTex = null;
function glowTexture() {
  if (_glowTex) return _glowTex;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  _glowTex = new THREE.CanvasTexture(c);
  return _glowTex;
}

// Distribute N points evenly over a sphere surface (Fibonacci lattice) so the
// graph forms a real globe rather than a sprawling 2-D web. A small deterministic
// radial jitter gives it organic depth so it reads as a 3-D ball, not a shell.
function spherePosition(i, n) {
  const R = 88 + n * 1.5;
  const golden = Math.PI * (1 + Math.sqrt(5));
  const t = (i + 0.5) / n;
  const phi = Math.acos(1 - 2 * t);          // inclination 0..π
  const theta = golden * i;                   // azimuth
  const rr = R * (1 - 0.12 * (((i * 1327) % 100) / 100));
  return {
    x: rr * Math.sin(phi) * Math.cos(theta),
    y: rr * Math.cos(phi),
    z: rr * Math.sin(phi) * Math.sin(theta),
  };
}

// ---------------------------------------------------------------------------
// Conversational query engine — rule-based NL over the graph (no API needed).
// Returns { answer, ids: Set|null, focusId }. ids=null means "show everything".
// ---------------------------------------------------------------------------
function edgeEnds(l) {
  return [l.source.id ?? l.source, l.target.id ?? l.target];
}
function answerQuery(text, nodes, links) {
  const q = text.toLowerCase().trim();
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const neighborsOf = (id) => {
    const s = new Set();
    links.forEach(l => { const [a, b] = edgeEnds(l); if (a === id) s.add(b); if (b === id) s.add(a); });
    return s;
  };

  if (/\b(reset|clear|show all|everything|deselect|start over)\b/.test(q))
    return { answer: 'Cleared — showing the full knowledge sphere.', ids: null, focusId: null };

  // Status / property filters
  const filters = [
    { re: /(past due|overdue|unpaid|late|collection|arrear)/, cat: 'Invoice', test: n => /past due/i.test(n.properties?.Status || ''), label: 'past-due invoices' },
    { re: /(vacant|empty|available unit|unoccupied)/, cat: 'Unit', test: n => /vacant/i.test(n.properties?.Status || ''), label: 'vacant units' },
    { re: /(expir|renew)/, cat: 'Lease', test: n => /expiring/i.test(n.properties?.Status || ''), label: 'leases expiring soon' },
    { re: /(open work|open wo|open maintenance|open ticket|pending repair)/, cat: 'WorkOrder', test: n => /open/i.test(n.properties?.Status || ''), label: 'open work orders' },
    { re: /(high priority|urgent|high.priority)/, cat: 'WorkOrder', test: n => /high/i.test(n.properties?.Priority || ''), label: 'high-priority work orders' },
    { re: /(balance|owes?|outstanding|behind on rent)/, cat: 'Tenant', test: n => !/^\$?0$/.test((n.properties?.Balance || '$0').replace(/\s/g, '')), label: 'tenants carrying a balance' },
  ];
  for (const f of filters) {
    if (f.re.test(q)) {
      const m = nodes.filter(n => n.category === f.cat && f.test(n));
      return {
        answer: m.length
          ? `Found ${m.length} ${f.label}: ${m.map(n => n.label).join(', ')}.`
          : `No ${f.label} in the current view.`,
        ids: new Set(m.map(n => n.id)),
      };
    }
  }

  // Named-entity lookup — longest label/keyword the question mentions.
  let entity = null, best = 0;
  nodes.forEach(n => { const lab = n.label.toLowerCase(); if (q.includes(lab) && lab.length > best) { entity = n; best = lab.length; } });
  if (!entity) {
    nodes.forEach(n => {
      const words = n.label.toLowerCase().split(/[\s#_-]+/).filter(w => w.length > 3);
      if (words.some(w => q.includes(w)) && n.label.length > best) { entity = n; best = n.label.length; }
    });
  }
  if (entity) {
    const nb = neighborsOf(entity.id);
    const ids = new Set([entity.id, ...nb]);
    const rels = links.filter(l => { const [a, b] = edgeEnds(l); return a === entity.id || b === entity.id; })
      .map(l => { const [a, b] = edgeEnds(l); const out = a === entity.id; const other = byId[out ? b : a]; return `${l.type.replace(/_/g, ' ')} ${other?.label ?? '?'}`; });
    return {
      answer: `${entity.label} · ${entity.category}${entity.description ? ' — ' + entity.description : ''} Connected to ${nb.size} entities: ${rels.slice(0, 6).join('; ')}${rels.length > 6 ? '…' : ''}.`,
      ids, focusId: entity.id,
    };
  }

  // Category filter ("show vendors", "how many tenants")
  let cat = null;
  if (/work ?orders?/.test(q)) cat = 'WorkOrder';
  else {
    const catMap = { owner: 'Owner', property: 'Property', properties: 'Property', unit: 'Unit', lease: 'Lease', tenant: 'Tenant', vendor: 'Vendor', invoice: 'Invoice', document: 'Document', doc: 'Document', video: 'Video', audio: 'Audio' };
    for (const k in catMap) { if (new RegExp(`\\b${k}s?\\b`).test(q)) { cat = catMap[k]; break; } }
  }
  if (cat) {
    const m = nodes.filter(n => n.category === cat);
    const lead = /how many|count|number of/.test(q) ? `There are ${m.length}` : `Showing ${m.length}`;
    return { answer: `${lead} ${cat} node${m.length === 1 ? '' : 's'}: ${m.map(n => n.label).join(', ')}.`, ids: new Set(m.map(n => n.id)) };
  }

  return {
    answer: 'I can highlight slices of the graph — try “past-due invoices”, “vacant units”, “vendors”, “high-priority work orders”, or anything tied to a property like “Maple Court”.',
    ids: null,
  };
}

const SUGGESTIONS = ['Past-due invoices', 'Vacant units', 'High-priority work orders', 'Maple Court', 'Show vendors'];

export function KnowledgeGraph({ nodes, links, categories }) {
  const fgRef = useRef(null);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState('');
  const [hiddenCategories, setHiddenCategories] = useState(new Set());

  // highlight = chat/search-driven focus. ids=null → nothing dimmed.
  const [highlight, setHighlight] = useState({ ids: null });
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Ask the graph anything. I’ll light up the matching entities and trace their links.' },
  ]);
  const [input, setInput] = useState('');
  const chatScrollRef = useRef(null);

  const colorMap = useMemo(() => {
    const map = {};
    categories.forEach((cat, i) => { map[cat] = COLORS[i % COLORS.length]; });
    return map;
  }, [categories]);

  // Stable cloned graph data with fixed spherical positions (fx/fy/fz pin each
  // node so the layout is a stable globe instead of a drifting force web).
  const master = useMemo(() => {
    const n = nodes.length || 1;
    return {
      nodes: nodes.map((node, i) => {
        const p = spherePosition(i, n);
        return { ...node, x: p.x, y: p.y, z: p.z, fx: p.x, fy: p.y, fz: p.z };
      }),
      links: links.map(l => ({ ...l })),
    };
  }, [nodes, links]);

  const graphData = useMemo(() => {
    const vis = master.nodes.filter(n => !hiddenCategories.has(n.category));
    const ids = new Set(vis.map(n => n.id));
    const ls = master.links.filter(l => { const [a, b] = edgeEnds(l); return ids.has(a) && ids.has(b); });
    return { nodes: vis, links: ls };
  }, [master, hiddenCategories]);

  // Search updates highlight live.
  useEffect(() => {
    if (!search.trim()) { setHighlight(h => (h.fromSearch ? { ids: null } : h)); return; }
    const m = master.nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));
    setHighlight({ ids: new Set(m.map(n => n.id)), fromSearch: true });
  }, [search, master]);

  const dimMode = !!highlight.ids;
  const isLit = useCallback((id) => !dimMode || highlight.ids.has(id), [dimMode, highlight]);

  // ----- Node objects: sphere/cube + always-on label sprite -----
  const makeNode = useCallback((node) => {
    const group = new THREE.Group();
    const lit = isLit(node.id);
    const r = 3 + node.weight * 0.9;
    const color = colorMap[node.category] || '#888';

    // glowing halo behind the orb (additive so orbs bloom on the dark globe)
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color, transparent: true,
      opacity: lit ? (dimMode ? 0.95 : 0.7) : 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const gs = r * 6.5;
    glow.scale.set(gs, gs, 1);
    group.add(glow);

    // the solid orb — self-illuminating so it pops without harsh shading
    const mat = new THREE.MeshStandardMaterial({
      color, transparent: true, opacity: lit ? 1 : 0.12,
      emissive: color, emissiveIntensity: lit ? (dimMode ? 0.75 : 0.45) : 0.05,
      roughness: 0.35, metalness: 0.1,
    });
    const geom = SOURCE_CATS.has(node.category)
      ? new THREE.BoxGeometry(r * 1.7, r * 1.7, r * 1.7)
      : new THREE.SphereGeometry(r, 24, 24);
    group.add(new THREE.Mesh(geom, mat));

    const label = new SpriteText(node.label);
    label.color = lit ? '#eef0f6' : 'rgba(160,165,180,0.22)';
    label.textHeight = lit && dimMode ? 3.6 : 3;
    label.fontWeight = lit && dimMode ? '600' : '400';
    label.backgroundColor = false;
    label.position.set(0, r + 4.5, 0);
    group.add(label);
    return group;
  }, [colorMap, isLit, dimMode]);

  const linkColor = useCallback((l) => {
    const [a, b] = edgeEnds(l);
    if (dimMode) return (highlight.ids.has(a) && highlight.ids.has(b)) ? 'rgba(124,193,236,0.85)' : 'rgba(120,125,140,0.05)';
    return 'rgba(150,156,170,0.28)';
  }, [dimMode, highlight]);

  const linkParticles = useCallback((l) => {
    if (!dimMode) return 0;
    const [a, b] = edgeEnds(l);
    return highlight.ids.has(a) && highlight.ids.has(b) ? 2 : 0;
  }, [dimMode, highlight]);

  // ----- Camera helpers -----
  const focusNode = useCallback((node) => {
    const fg = fgRef.current;
    if (!fg || node?.x == null) return;
    const r = Math.hypot(node.x, node.y, node.z) || 1;
    const k = 1 + 110 / r;
    fg.cameraPosition({ x: node.x * k, y: node.y * k, z: node.z * k }, node, 1200);
  }, []);

  // ----- Conversational submit -----
  const runQuery = useCallback((text) => {
    const t = text.trim();
    if (!t) return;
    setMessages(m => [...m, { role: 'user', text: t }]);
    const res = answerQuery(t, graphData.nodes, graphData.links);
    setHighlight({ ids: res.ids });
    setMessages(m => [...m, { role: 'ai', text: res.answer }]);
    setInput('');
    if (res.focusId) {
      const n = graphData.nodes.find(x => x.id === res.focusId);
      setSelectedNode(n || null);
      setTimeout(() => focusNode(n), 350);
    } else if (res.ids && res.ids.size) {
      setTimeout(() => fgRef.current?.zoomToFit(900, 80, n => res.ids.has(n.id)), 350);
    } else {
      setTimeout(() => fgRef.current?.zoomToFit(900, 60), 350);
    }
  }, [graphData, focusNode]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages, chatOpen]);

  // ----- Sizing -----
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDims({ w: clientWidth, h: clientHeight });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Orbit auto-rotation gives the sphere life; pause it while inspecting a node.
  const setAutoRotate = useCallback((on) => {
    const c = fgRef.current?.controls?.();
    if (c) { c.autoRotate = on; c.autoRotateSpeed = 0.5; }
  }, []);

  // On mount: brighten the scene for the emissive orbs, kick off rotation and
  // frame the whole globe.
  useEffect(() => {
    const id = setTimeout(() => {
      const fg = fgRef.current;
      if (!fg) return;
      const scene = fg.scene?.();
      if (scene) {
        scene.add(new THREE.AmbientLight(0xffffff, 0.65));
        const p = new THREE.PointLight(0xffffff, 0.7);
        p.position.set(200, 200, 200);
        scene.add(p);
      }
      setAutoRotate(true);
      fg.zoomToFit(800, 80);
    }, 400);
    return () => clearTimeout(id);
  }, [setAutoRotate]);

  const toggleCategory = (cat) => {
    setHiddenCategories(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const resetView = () => {
    setHighlight({ ids: null });
    setSearch('');
    setSelectedNode(null);
    setTimeout(() => fgRef.current?.zoomToFit(800, 60), 50);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: 500, background: BG, overflow: 'hidden' }}>
      <ForceGraph3D
        ref={fgRef}
        width={dims.w}
        height={dims.h}
        graphData={graphData}
        backgroundColor={BG}
        showNavInfo={false}
        controlType="orbit"
        nodeThreeObject={makeNode}
        nodeLabel={n => `${n.label} · ${n.category}`}
        linkColor={linkColor}
        linkWidth={l => { const [a, b] = edgeEnds(l); return dimMode && highlight.ids.has(a) && highlight.ids.has(b) ? 1.4 : 0.5; }}
        linkOpacity={1}
        linkCurvature={0.28}
        linkCurveRotation={l => { const [a] = edgeEnds(l); return (String(a).length % 7) / 7 * Math.PI; }}
        linkDirectionalParticles={linkParticles}
        linkDirectionalParticleWidth={1.6}
        linkDirectionalParticleSpeed={0.012}
        warmupTicks={0}
        cooldownTicks={0}
        onEngineStop={() => fgRef.current?.zoomToFit(700, 80)}
        onNodeClick={(node) => { setAutoRotate(false); setSelectedNode(node); focusNode(node); }}
        onBackgroundClick={() => { setSelectedNode(null); setAutoRotate(true); }}
      />

      {/* Left rail — search + legend stacked above the assistant in one flex
          column, so the chat always docks below the legend and never overlaps it.
          pointer-events are off on the rail (so graph drags pass through the gap)
          and back on for each panel. */}
      <div style={{ position: 'absolute', top: 16, left: 16, bottom: 16, width: 300, display: 'flex', flexDirection: 'column', gap: 12, pointerEvents: 'none', zIndex: 6 }}>
        {/* Search + legend — dark glass panel (was unreadable white-on-white) */}
        <div className="kg-panel" style={{ width: '100%', flexShrink: 0, pointerEvents: 'auto' }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <Search size={15} style={{ color: 'var(--gray-500)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search nodes…"
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--gray-900)', fontSize: 13 }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }} className="flex flex-col gap-1">
            {categories.map(cat => (
              <div key={cat} className="kg-legend-row" style={{ opacity: hiddenCategories.has(cat) ? 0.4 : 1 }} onClick={() => toggleCategory(cat)}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: colorMap[cat], flexShrink: 0, boxShadow: `0 0 6px ${colorMap[cat]}66` }} />
                <span>{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversational dock — fills the remaining rail height below the legend */}
        {chatOpen && (
          <div className="kg-chat" style={{ position: 'static', width: '100%', maxHeight: 'none', flex: '1 1 auto', minHeight: 180, pointerEvents: 'auto' }}>
            <div className="kg-chat-head"><Sparkles size={14} /> Graph Assistant</div>
            <div className="kg-chat-body" ref={chatScrollRef} style={{ flex: '1 1 auto', minHeight: 0 }}>
              {messages.map((m, i) => (
                <div key={i} className={`kg-msg ${m.role}`}>{m.text}</div>
              ))}
            </div>
            <div className="kg-chat-chips">
              {SUGGESTIONS.map(s => <button key={s} onClick={() => runQuery(s)} className="kg-chip">{s}</button>)}
            </div>
            <form className="kg-chat-input" onSubmit={e => { e.preventDefault(); runQuery(input); }}>
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about the graph…" />
              <button type="submit" aria-label="Send"><Send size={15} /></button>
            </form>
          </div>
        )}
      </div>

      {/* View controls */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 6 }}>
        <button className="kg-tool-btn" onClick={resetView} title="Reset view"><RotateCcw size={14} /> Reset</button>
        <button className="kg-tool-btn" onClick={() => setChatOpen(o => !o)} title="Toggle assistant">
          <MessageSquare size={14} /> {chatOpen ? 'Hide' : 'Ask'}
        </button>
      </div>

      {/* Inspector (dark-themed via existing .kg-* styles) */}
      {selectedNode && (() => {
        const isSource = SOURCE_CATS.has(selectedNode.category);
        const Icon = SOURCE_ICON[selectedNode.category];
        const conns = graphData.links
          .filter(l => { const [a, b] = edgeEnds(l); return a === selectedNode.id || b === selectedNode.id; })
          .map(l => { const [a, b] = edgeEnds(l); const out = a === selectedNode.id; const oid = out ? b : a; return { type: l.type, other: graphData.nodes.find(n => n.id === oid), out }; })
          .filter(c => c.other);
        const sourceConns = conns.filter(c => SOURCE_CATS.has(c.other.category));
        const entityConns = conns.filter(c => !SOURCE_CATS.has(c.other.category));
        const props = Object.entries(selectedNode.properties || {});
        const color = colorMap[selectedNode.category];
        const goto = (n) => { setSelectedNode(n); focusNode(n); };
        return (
          <div className="kg-inspector">
            <div className="kg-insp-head" style={{ background: color }}>
              <div className="flex items-center gap-2 min-w-0">
                {Icon ? <Icon size={16} /> : <span className="kg-insp-dot" />}
                <span className="kg-insp-title">{selectedNode.label}</span>
              </div>
              <button className="kg-insp-x" onClick={() => setSelectedNode(null)}><X size={16} /></button>
            </div>
            <div className="kg-insp-body">
              <div className="flex gap-2 flex-wrap">
                <span className="pill pill-purple">{selectedNode.category}</span>
                <span className="pill pill-neutral">{selectedNode.dept}</span>
                {isSource && <span className="pill pill-info">knowledge source</span>}
              </div>
              {selectedNode.description && <p className="kg-insp-desc">{selectedNode.description}</p>}
              {isSource && (
                <button className="btn btn-outline btn-sm w-full" style={{ marginBottom: 2 }}>
                  <ExternalLink size={13} /> Open {selectedNode.category.toLowerCase()}
                </button>
              )}
              {props.length > 0 && (<>
                <div className="kg-insp-label">Properties</div>
                <div className="kg-props">
                  {props.map(([k, v]) => (
                    <div key={k} className="kg-prop"><span className="kg-prop-k">{k}</span><span className="kg-prop-v">{String(v)}</span></div>
                  ))}
                </div>
              </>)}
              {sourceConns.length > 0 && (<>
                <div className="kg-insp-label">{isSource ? 'Grounds' : 'Knowledge sources'}</div>
                <div className="flex flex-col gap-1">
                  {sourceConns.map((c, i) => {
                    const SI = SOURCE_ICON[c.other.category];
                    return (
                      <button key={i} className="kg-conn kg-conn-src" onClick={() => goto(c.other)}>
                        {SI && <SI size={13} style={{ color: colorMap[c.other.category], flexShrink: 0 }} />}
                        <span className="kg-conn-type">{c.type}</span>
                        <span className="kg-conn-other">{c.other.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>)}
              {entityConns.length > 0 && (<>
                <div className="kg-insp-label">Relationships</div>
                <div className="flex flex-col gap-1" style={{ maxHeight: 132, overflowY: 'auto' }}>
                  {entityConns.map((c, i) => (
                    <button key={i} className="kg-conn" onClick={() => goto(c.other)}>
                      {c.out ? <ArrowRight size={12} className="text-muted" style={{ flexShrink: 0 }} /> : <ArrowLeft size={12} className="text-muted" style={{ flexShrink: 0 }} />}
                      <span className="kg-conn-type">{c.type}</span>
                      <span className="kg-conn-other">{c.other.label}</span>
                    </button>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
