import { Node, Edge, MarkerType } from '@xyflow/react';
import { ASTNode } from './parser';
import dagre from 'dagre';

type Exit = { id: string; label?: string; handle?: string };

export function astToGraph(
  ast: ASTNode[],
  nodePrefs: Record<string, boolean> = {},
  onToggleDirection: (id: string) => void = () => {},
  edgeOffsets: Record<string, {x: number, y: number}> = {},
  onEdgeOffsetChange: (id: string, offset: {x: number, y: number}) => void = () => {}
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const dagreEdges: { source: string; target: string; weight?: number; minlen?: number }[] = [];
  
  const idCounts: Record<string, number> = {};
  const getId = (base: string) => {
    const key = base.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20) || 'node';
    idCounts[key] = (idCounts[key] || 0) + 1;
    return `${key}_${idCounts[key]}`;
  };

  const startId = getId('start');
  nodes.push({ id: startId, type: 'start', data: { label: 'Початок' }, position: { x: 0, y: 0 } });

  function connect(
    source: Exit,
    targetId: string,
    options?: { isBackEdge?: boolean; isLayoutOnly?: boolean; weight?: number; minlen?: number; targetHandle?: string }
  ) {
    if (!options?.isLayoutOnly) {
      const edgeId = `e_${source.id}_${targetId}_${source.handle || ''}`;
      edges.push({
        id: edgeId,
        source: source.id,
        target: targetId,
        sourceHandle: source.handle,
        targetHandle: options?.targetHandle,
        type: 'custom',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        style: { stroke: '#64748b', strokeWidth: 2 },
        data: {
          label: source.label,
          id: edgeId,
          offset: edgeOffsets[edgeId] || { x: 0, y: 0 },
          onOffsetChange: onEdgeOffsetChange
        }
      });
    }

    if (!options?.isBackEdge) {
      dagreEdges.push({
        source: source.id,
        target: targetId,
        weight: options?.weight ?? 1,
        minlen: options?.minlen ?? 1,
      });
    }
  }

  function processBlock(block: ASTNode[], incomingExits: Exit[]): Exit[] {
    let currentExits = incomingExits;

    for (const node of block) {
      if (node.type === 'statement') {
        const id = getId('stmt_' + node.text);
        let type = 'process';
        if (node.text.startsWith('cin') || node.text.startsWith('cout')) type = 'io';

        nodes.push({ id, type, data: { label: node.text }, position: { x: 0, y: 0 } });
        currentExits.forEach((exit) => connect(exit, id));
        currentExits = [{ id }];
      } else if (node.type === 'if') {
        const id = getId('if_' + node.condition);
        const isFlipped = nodePrefs[id] || false;
        nodes.push({ id, type: 'decision', data: { label: node.condition + ' ?', id, isFlipped, onToggleDirection }, position: { x: 0, y: 0 } });
        currentExits.forEach((exit) => connect(exit, id));

        let trueExits: Exit[] = [];
        if (node.trueBlock.length === 0) {
          trueExits = [{ id, label: 'Так', handle: 'yes' }];
        } else {
          trueExits = processBlock(node.trueBlock, [{ id, label: 'Так', handle: 'yes' }]);
        }

        let falseExits: Exit[] = [];
        if (node.falseBlock.length === 0) {
          falseExits = [{ id, label: 'Ні', handle: 'no' }];
        } else {
          falseExits = processBlock(node.falseBlock, [{ id, label: 'Ні', handle: 'no' }]);
        }

        currentExits = [...trueExits, ...falseExits];
      } else if (node.type === 'loop') {
        const id = getId('loop_' + node.condition);
        const isFlipped = nodePrefs[id] || false;
        nodes.push({ id, type: 'loop', data: { label: node.condition, id, isFlipped, onToggleDirection }, position: { x: 0, y: 0 } });
        currentExits.forEach((exit) => connect(exit, id));

        let bodyExits: Exit[] = [];
        if (node.body.length === 0) {
          bodyExits = [{ id, label: 'Так', handle: 'yes' }];
        } else {
          bodyExits = processBlock(node.body, [{ id, label: 'Так', handle: 'yes' }]);
        }

        // Loop back
        bodyExits.forEach((exit) => connect(exit, id, { isBackEdge: true, targetHandle: 'back' }));

        currentExits = [{ id, label: 'Ні', handle: 'no' }];
      }
    }
    return currentExits;
  }

  const finalExits = processBlock(ast, [{ id: startId }]);

  const endId = getId('end');
  nodes.push({ id: endId, type: 'end', data: { label: 'Кінець' }, position: { x: 0, y: 0 } });
  finalExits.forEach((exit) => connect(exit, endId));

  return layoutGraph(nodes, edges, dagreEdges);
}

function layoutGraph(nodes: Node[], edges: Edge[], dagreEdges: { source: string; target: string; weight?: number; minlen?: number }[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Adjusted spacing for a more compact layout
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 50, edgesep: 30 });

  nodes.forEach((node) => {
    let width = 200;
    let height = 50;
    if (node.type === 'decision' || node.type === 'loop') {
      width = 160;
      height = 100;
    }
    dagreGraph.setNode(node.id, { width, height });
  });

  dagreEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, { weight: edge.weight, minlen: edge.minlen });
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x,
        y: nodeWithPosition.y,
      },
      origin: [0.5, 0.5] as [number, number],
      sourcePosition: 'bottom',
      targetPosition: 'top',
    };
  });

  return { nodes: layoutedNodes, edges };
}
