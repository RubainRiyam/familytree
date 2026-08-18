import type { FamilyMember, TreeNodeData, TreeEdgeData } from '@/types';

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalGap: number;
  verticalGap: number;
  spouseGap: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 180,
  nodeHeight: 90,
  horizontalGap: 40,
  verticalGap: 140,
  spouseGap: 20,
};

interface InternalNode {
  id: string;
  member: FamilyMember;
  children: InternalNode[];
  spouseNode?: InternalNode;
  x: number;
  y: number;
  generation: number;
  subtreeWidth: number;
}

export function computeTreeLayout(
  members: FamilyMember[],
  configOverride?: Partial<LayoutConfig>
): { nodes: TreeNodeData[]; edges: TreeEdgeData[]; width: number; height: number } {
  const config = { ...DEFAULT_CONFIG, ...configOverride };
  const byId = new Map(members.map(m => [m.id, m]));

  const roots = members.filter(m => !m.fatherId && !m.motherId);
  if (roots.length === 0 && members.length > 0) {
    roots.push(members[0]);
  }

  const visited = new Set<string>();
  const internalTrees: InternalNode[] = [];

  for (const root of roots) {
    if (visited.has(root.id)) continue;
    const tree = buildTree(root, byId, visited, 0);
    if (tree) internalTrees.push(tree);
  }

  for (const m of members) {
    if (!visited.has(m.id)) {
      const tree = buildTree(m, byId, visited, 0);
      if (tree) internalTrees.push(tree);
    }
  }

  computeSubtreeWidths(internalTrees, config);

  let offsetX = config.horizontalGap;
  for (const tree of internalTrees) {
    assignPositions(tree, offsetX, config.verticalGap, config);
    offsetX += tree.subtreeWidth + config.horizontalGap * 2;
  }

  const nodes: TreeNodeData[] = [];
  const edges: TreeEdgeData[] = [];
  const addedNodes = new Set<string>();

  for (const tree of internalTrees) {
    collectNodesAndEdges(tree, nodes, edges, addedNodes, config);
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of nodes) {
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }

  return {
    nodes,
    edges,
    width: maxX + config.horizontalGap,
    height: maxY + config.verticalGap,
  };
}

function buildTree(
  member: FamilyMember,
  byId: Map<string, FamilyMember>,
  visited: Set<string>,
  generation: number
): InternalNode | null {
  if (visited.has(member.id)) return null;
  visited.add(member.id);

  const node: InternalNode = {
    id: member.id,
    member,
    children: [],
    x: 0,
    y: 0,
    generation,
    subtreeWidth: 0,
  };

  if (member.spouseId && !visited.has(member.spouseId)) {
    const spouse = byId.get(member.spouseId);
    if (spouse) {
      visited.add(spouse.id);
      node.spouseNode = {
        id: spouse.id,
        member: spouse,
        children: [],
        x: 0,
        y: 0,
        generation,
        subtreeWidth: 0,
      };
    }
  }

  const childIds = new Set<string>();
  for (const cid of member.childrenIds) childIds.add(cid);
  if (node.spouseNode) {
    for (const cid of node.spouseNode.member.childrenIds) childIds.add(cid);
  }

  for (const cid of childIds) {
    if (visited.has(cid)) continue;
    const child = byId.get(cid);
    if (!child) continue;
    const childNode = buildTree(child, byId, visited, generation + 1);
    if (childNode) node.children.push(childNode);
  }

  return node;
}

function computeSubtreeWidths(trees: InternalNode[], config: LayoutConfig): void {
  for (const tree of trees) {
    computeSubtreeWidth(tree, config);
  }
}

function computeSubtreeWidth(node: InternalNode, config: LayoutConfig): number {
  const selfWidth = node.spouseNode
    ? config.nodeWidth * 2 + config.spouseGap
    : config.nodeWidth;

  if (node.children.length === 0) {
    node.subtreeWidth = selfWidth;
    return selfWidth;
  }

  let childrenWidth = 0;
  for (let i = 0; i < node.children.length; i++) {
    childrenWidth += computeSubtreeWidth(node.children[i], config);
    if (i < node.children.length - 1) childrenWidth += config.horizontalGap;
  }

  node.subtreeWidth = Math.max(selfWidth, childrenWidth);
  return node.subtreeWidth;
}

function assignPositions(
  node: InternalNode,
  startX: number,
  startY: number,
  config: LayoutConfig
): void {
  const selfWidth = node.spouseNode
    ? config.nodeWidth * 2 + config.spouseGap
    : config.nodeWidth;

  const centerX = startX + node.subtreeWidth / 2;
  node.x = centerX - selfWidth / 2;
  node.y = startY;

  if (node.spouseNode) {
    node.spouseNode.x = node.x + config.nodeWidth + config.spouseGap;
    node.spouseNode.y = startY;
  }

  if (node.children.length === 0) return;

  let totalChildrenWidth = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalChildrenWidth += node.children[i].subtreeWidth;
    if (i < node.children.length - 1) totalChildrenWidth += config.horizontalGap;
  }

  let childX = centerX - totalChildrenWidth / 2;
  const childY = startY + config.nodeHeight + config.verticalGap;

  for (const child of node.children) {
    assignPositions(child, childX, childY, config);
    childX += child.subtreeWidth + config.horizontalGap;
  }
}

function collectNodesAndEdges(
  node: InternalNode,
  nodes: TreeNodeData[],
  edges: TreeEdgeData[],
  addedNodes: Set<string>,
  config: LayoutConfig
): void {
  if (!addedNodes.has(node.id)) {
    nodes.push({
      member: node.member,
      x: node.x,
      y: node.y,
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
    addedNodes.add(node.id);
  }

  if (node.spouseNode && !addedNodes.has(node.spouseNode.id)) {
    nodes.push({
      member: node.spouseNode.member,
      x: node.spouseNode.x,
      y: node.spouseNode.y,
      width: config.nodeWidth,
      height: config.nodeHeight,
    });
    addedNodes.add(node.spouseNode.id);

    edges.push({
      from: node.id,
      to: node.spouseNode.id,
      type: 'spouse',
    });
  }

  for (const child of node.children) {
    edges.push({
      from: node.id,
      to: child.id,
      type: 'parent-child',
    });

    collectNodesAndEdges(child, nodes, edges, addedNodes, config);
  }
}
