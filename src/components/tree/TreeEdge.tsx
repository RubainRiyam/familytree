import type { TreeNodeData, TreeEdgeData } from '@/types';

interface TreeEdgeProps {
  edge: TreeEdgeData;
  nodeMap: Map<string, TreeNodeData>;
}

export function TreeEdge({ edge, nodeMap }: TreeEdgeProps) {
  const fromNode = nodeMap.get(edge.from);
  const toNode = nodeMap.get(edge.to);
  if (!fromNode || !toNode) return null;

  if (edge.type === 'spouse') {
    const y = fromNode.y + fromNode.height / 2;
    const x1 = fromNode.x + fromNode.width;
    const x2 = toNode.x;
    const midX = (x1 + x2) / 2;

    return (
      <g>
        <line
          x1={x1}
          y1={y}
          x2={x2}
          y2={y}
          stroke="#f9a8d4"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <circle cx={midX} cy={y} r={4} fill="#f9a8d4" />
      </g>
    );
  }

  const x1 = fromNode.x + fromNode.width / 2;
  const y1 = fromNode.y + fromNode.height;
  const x2 = toNode.x + toNode.width / 2;
  const y2 = toNode.y;
  const midY = (y1 + y2) / 2;

  return (
    <path
      d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
      fill="none"
      stroke="#cbd5e1"
      strokeWidth={1.5}
    />
  );
}
