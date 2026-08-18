import { useRef, useState, useCallback, useEffect } from 'react';
import type { TreeNodeData, TreeEdgeData } from '@/types';
import { TreeNode } from './TreeNode';
import { TreeEdge } from './TreeEdge';

interface TreeCanvasProps {
  nodes: TreeNodeData[];
  edges: TreeEdgeData[];
  width: number;
  height: number;
  highlightId?: string;
  onNodeClick: (id: string) => void;
}

export function TreeCanvas({ nodes, edges, width, height, highlightId, onNodeClick }: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);

  const nodeMap = new Map(nodes.map(n => [n.member.id, n]));

  useEffect(() => {
    if (!svgRef.current || initialized) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgW = rect.width || 800;
    const svgH = rect.height || 600;

    if (highlightId) {
      const target = nodeMap.get(highlightId);
      if (target) {
        setViewBox({
          x: target.x - svgW / 2 + target.width / 2,
          y: target.y - svgH / 3,
          w: svgW,
          h: svgH,
        });
        setInitialized(true);
        return;
      }
    }

    const padded = Math.max(width, svgW);
    const paddedH = Math.max(height, svgH);
    setViewBox({
      x: -50,
      y: -20,
      w: padded + 100,
      h: paddedH + 40,
    });
    setInitialized(true);
  }, [nodes.length, highlightId]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox(vb => {
        const newW = vb.w * factor;
        const newH = vb.h * factor;
        const dx = (vb.w - newW) / 2;
        const dy = (vb.h - newH) / 2;
        return { x: vb.x + dx, y: vb.y + dy, w: newW, h: newH };
      });
    },
    []
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      setViewBox(vb => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    },
    [isPanning, panStart, viewBox]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  function handleZoomIn() {
    setViewBox(vb => {
      const factor = 0.8;
      const newW = vb.w * factor;
      const newH = vb.h * factor;
      return { x: vb.x + (vb.w - newW) / 2, y: vb.y + (vb.h - newH) / 2, w: newW, h: newH };
    });
  }

  function handleZoomOut() {
    setViewBox(vb => {
      const factor = 1.25;
      const newW = vb.w * factor;
      const newH = vb.h * factor;
      return { x: vb.x + (vb.w - newW) / 2, y: vb.y + (vb.h - newH) / 2, w: newW, h: newH };
    });
  }

  function handleFit() {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgW = rect.width || 800;
    const svgH = rect.height || 600;
    const padded = Math.max(width, svgW);
    const paddedH = Math.max(height, svgH);
    setViewBox({ x: -50, y: -20, w: padded + 100, h: paddedH + 40 });
  }

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors shadow-sm text-text"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors shadow-sm text-text"
        >
          -
        </button>
        <button
          onClick={handleFit}
          className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center hover:bg-surface-hover transition-colors shadow-sm text-text text-xs"
          title="Fit to view"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        {edges.map((edge, i) => (
          <TreeEdge key={i} edge={edge} nodeMap={nodeMap} />
        ))}
        {nodes.map(node => (
          <TreeNode
            key={node.member.id}
            node={node}
            isHighlighted={node.member.id === highlightId}
            onClick={onNodeClick}
          />
        ))}
      </svg>
    </div>
  );
}
