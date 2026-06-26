import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3-force';
import { Search, X, FileText, Video, AudioLines, ExternalLink, ArrowRight, ArrowLeft } from 'lucide-react';

// Unstructured knowledge-source categories (drawn as rounded squares, inspected
// with a media header) vs. structured ontology entities (drawn as circles).
const SOURCE_CATS = new Set(['Document', 'Video', 'Audio']);
const SOURCE_ICON = { Document: FileText, Video: Video, Audio: AudioLines };

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', 
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

export function KnowledgeGraph({ nodes, links, categories }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch] = useState('');
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hiddenCategories, setHiddenCategories] = useState(new Set());
  
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  const colorMap = useMemo(() => {
    const map = {};
    categories.forEach((cat, i) => {
      map[cat] = COLORS[i % COLORS.length];
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    // Clone data for simulation
    nodesRef.current = nodes.map(n => ({ ...n }));
    linksRef.current = links.map(l => ({ ...l }));
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const simulation = d3.forceSimulation(nodesRef.current)
      .force('link', d3.forceLink(linksRef.current).id(d => d.id).distance(95))
      .force('charge', d3.forceManyBody().strength(-260))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(d => 8 + d.weight * 2).iterations(2))
      .stop();

    // Run synchronously
    for (let i = 0; i < 280; ++i) simulation.tick();
    
    simulationRef.current = simulation;
    
    // Fit to view
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodesRef.current.forEach(n => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });
    
    const scaleX = width / (maxX - minX + 100);
    const scaleY = height / (maxY - minY + 100);
    const k = Math.min(scaleX, scaleY, 2);
    const x = width / 2 - ((minX + maxX) / 2) * k;
    const y = height / 2 - ((minY + maxY) / 2) * k;
    
    setTransform({ x, y, k });
    draw();
  }, [nodes, links]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);
    
    const visibleNodes = nodesRef.current.filter(n => !hiddenCategories.has(n.category));
    const visibleIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = linksRef.current.filter(l => visibleIds.has(l.source.id) && visibleIds.has(l.target.id));
    
    // Draw links
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(180, 185, 195, 0.5)';
    ctx.lineWidth = 1 / transform.k;
    visibleLinks.forEach(l => {
      ctx.moveTo(l.source.x, l.source.y);
      ctx.lineTo(l.target.x, l.target.y);
    });
    ctx.stroke();

    // Determine highlight state
    const focusNode = hoveredNode || selectedNode;
    let focusIds = new Set();
    if (focusNode) {
      focusIds.add(focusNode.id);
      visibleLinks.forEach(l => {
        if (l.source.id === focusNode.id) focusIds.add(l.target.id);
        if (l.target.id === focusNode.id) focusIds.add(l.source.id);
      });
    }

    // Edge property labels — show the relationship type on edges of the focused node.
    if (focusNode) {
      ctx.font = `${9 / transform.k}px Inter`;
      ctx.textAlign = 'center';
      visibleLinks.forEach(l => {
        if (!l.type) return;
        if (l.source.id !== focusNode.id && l.target.id !== focusNode.id) return;
        const mx = (l.source.x + l.target.x) / 2, my = (l.source.y + l.target.y) / 2;
        const padX = 3 / transform.k, h = 12 / transform.k;
        const w = ctx.measureText(l.type).width + padX * 2;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(mx - w / 2, my - h / 2, w, h);
        ctx.fillStyle = '#6d28d9';
        ctx.fillText(l.type, mx, my + h * 0.28);
      });
      ctx.textAlign = 'left';
    }

    // Draw nodes — entities as circles, knowledge sources as rounded squares.
    visibleNodes.forEach(n => {
      const isFocused = focusIds.size === 0 || focusIds.has(n.id);
      const isSearchResult = search && n.label.toLowerCase().includes(search.toLowerCase());
      const r = 2 + n.weight * 1.5;
      ctx.fillStyle = colorMap[n.category];
      ctx.globalAlpha = isFocused || isSearchResult ? 1 : 0.15;

      ctx.beginPath();
      if (SOURCE_CATS.has(n.category)) {
        const s = r * 1.9;
        if (ctx.roundRect) ctx.roundRect(n.x - s / 2, n.y - s / 2, s, s, 2.5 / transform.k);
        else ctx.rect(n.x - s / 2, n.y - s / 2, s, s);
        ctx.fill();
        // subtle white inset so artifacts read as "cards"
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.2 / transform.k;
        ctx.stroke();
      } else {
        ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);
        ctx.fill();
      }

      if (search && isSearchResult) {
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2 / transform.k;
        ctx.stroke();
      }
    });
    
    // Node labels — small graph, so label every node (dim the unfocused ones).
    ctx.font = `${9.5 / transform.k}px Inter`;
    visibleNodes.forEach(n => {
      const isFocused = focusIds.size === 0 || focusIds.has(n.id);
      const isSearchResult = search && n.label.toLowerCase().includes(search.toLowerCase());
      ctx.globalAlpha = isFocused || isSearchResult ? 1 : 0.2;
      ctx.fillStyle = '#1f2937';
      ctx.fillText(n.label, n.x + 6 + n.weight * 1.5, n.y + 3);
    });
    ctx.globalAlpha = 1;
    
    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [transform, hoveredNode, selectedNode, hiddenCategories, search]);

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    if (e.buttons === 1) { // Dragging
      setTransform(prev => ({
        ...prev,
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
      return;
    }
    
    // Hit testing
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - transform.x) / transform.k;
    const mouseY = (e.clientY - rect.top - transform.y) / transform.k;
    
    let found = null;
    const visibleNodes = nodesRef.current.filter(n => !hiddenCategories.has(n.category));
    for (let n of visibleNodes) {
      const r = 2 + n.weight * 1.5;
      if (Math.hypot(n.x - mouseX, n.y - mouseY) < r + 5 / transform.k) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = Math.pow(0.999, e.deltaY);
    setTransform(prev => {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const newK = Math.max(0.1, Math.min(prev.k * zoomFactor, 10));
      const scaleRatio = newK / prev.k;
      
      return {
        x: mouseX - (mouseX - prev.x) * scaleRatio,
        y: mouseY - (mouseY - prev.y) * scaleRatio,
        k: newK
      };
    });
  };

  const handleClick = () => {
    setSelectedNode(hoveredNode);
  };

  const toggleCategory = (cat) => {
    const next = new Set(hiddenCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setHiddenCategories(next);
  };

  // Setup canvas size
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        draw();
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="graph-canvas-wrap w-full" style={{ height: '600px' }} ref={containerRef}>
      <canvas 
        ref={canvasRef} 
        style={{ width: '100%', height: '100%', cursor: hoveredNode ? 'pointer' : 'grab' }}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onClick={handleClick}
        onMouseLeave={() => setHoveredNode(null)}
      />
      
      <div style={{ position: 'absolute', top: 16, left: 16, background: 'var(--surface, rgba(255,255,255,0.9))', padding: '12px', borderRadius: '8px', boxShadow: 'var(--shadow-sm)', width: '250px' }}>
        <div className="flex items-center gap-2 mb-3">
          <Search size={16} className="text-muted" />
          <input 
            className="search-input" 
            style={{ padding: '6px 12px', border: 'none', background: 'transparent', outline: 'none' }} 
            placeholder="Search nodes..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }} className="flex flex-col gap-1">
          {categories.map(cat => (
            <div 
              key={cat} 
              className="flex items-center gap-2 text-sm cursor-pointer" 
              style={{ opacity: hiddenCategories.has(cat) ? 0.5 : 1 }}
              onClick={() => toggleCategory(cat)}
            >
              <div style={{ width: 12, height: 12, background: colorMap[cat], borderRadius: 2 }} />
              {cat}
            </div>
          ))}
        </div>
      </div>
      
      {selectedNode && (() => {
        const isSource = SOURCE_CATS.has(selectedNode.category);
        const Icon = SOURCE_ICON[selectedNode.category];
        const conns = linksRef.current
          .filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id)
          .map(l => { const out = l.source.id === selectedNode.id; return { type: l.type, other: out ? l.target : l.source, out }; });
        const sourceConns = conns.filter(c => SOURCE_CATS.has(c.other.category));
        const entityConns = conns.filter(c => !SOURCE_CATS.has(c.other.category));
        const props = Object.entries(selectedNode.properties || {});
        const color = colorMap[selectedNode.category];
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
                      <button key={i} className="kg-conn kg-conn-src" onClick={() => setSelectedNode(nodesRef.current.find(n => n.id === c.other.id) || c.other)}>
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
                    <button key={i} className="kg-conn" onClick={() => setSelectedNode(nodesRef.current.find(n => n.id === c.other.id) || c.other)}>
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
