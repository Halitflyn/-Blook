/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Download, Code2 } from 'lucide-react';
import { parseToAST } from './lib/parser';
import { astToGraph } from './lib/graph';
import { StartNode, EndNode, ProcessNode, DecisionNode, IONode, LoopNode } from './components/nodes';
import { CustomEdge } from './components/edges';

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  io: IONode,
  loop: LoopNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const defaultCode = `#include <iostream>
#include <cmath>

using namespace std;

int main() {
    double x, y, a, b, t;
    cout << "Введіть параметри: x, y, a, b, t: ";
    cin >> x >> y >> a >> b >> t;

    double part1 = x * sin(a * t);
    double part2 = y * sin(b * t);
    double sum = part1 + part2;
    double diff = part2 - part1;

    double numerator;
    if (sum < 0) {
        numerator = -pow(-sum, 1.0 / 5.0);
    } else {
        numerator = pow(sum, 1.0 / 5.0);
    }

    double denominator;
    if (diff < 0) {
        denominator = -pow(-diff, 1.0 / 5.0);
    } else {
        denominator = pow(diff, 1.0 / 5.0);
    }

    if (denominator == 0) {
        cout << "Помилка: ділення на нуль!";
    } else {
        double z = numerator / denominator;
        cout << "Результат z = " << z;
    }

    double A[5] = {2.5, -1.2, 0.5, 3.3, -4.1};
    double maxNeg = 0;
    
    for (int i = 0; i < 5; i++) {
        if (A[i] < 0) {
            if (maxNeg == 0) {
                maxNeg = A[i];
            } else if (A[i] > maxNeg) {
                maxNeg = A[i];
            }
        }
    }

    cout << "Найбільший від'ємний елемент: " << maxNeg;
    return 0;
}`;

export default function App() {
  const [code, setCode] = useState(defaultCode);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState<string | null>(null);
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  const nodePrefsRef = useRef<Record<string, boolean>>({});
  const edgeOffsetsRef = useRef<Record<string, {x: number, y: number}>>({});

  const handleToggleDirection = useCallback((id: string) => {
    nodePrefsRef.current[id] = !nodePrefsRef.current[id];
    setLayoutTrigger(prev => prev + 1);
  }, []);

  const handleEdgeOffsetChange = useCallback((id: string, offset: {x: number, y: number}) => {
    edgeOffsetsRef.current[id] = offset;
  }, []);

  const generateFlowchart = useCallback(() => {
    try {
      setError(null);
      const ast = parseToAST(code);
      const { nodes: layoutedNodes, edges: layoutedEdges } = astToGraph(
        ast,
        nodePrefsRef.current,
        handleToggleDirection,
        edgeOffsetsRef.current,
        handleEdgeOffsetChange
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Помилка парсингу коду');
    }
  }, [code, setNodes, setEdges, handleToggleDirection, handleEdgeOffsetChange]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      generateFlowchart();
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, layoutTrigger, generateFlowchart]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Editor */}
      <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-slate-200 bg-slate-900 shadow-xl z-10">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>C++ Редактор</span>
          </div>
          <div className="flex items-center gap-2">
            {error ? (
              <span className="text-xs text-red-400 font-medium px-2 py-1 bg-red-400/10 rounded">Помилка</span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium px-2 py-1 bg-emerald-400/10 rounded">Оновлено</span>
            )}
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 w-full p-4 bg-transparent text-slate-300 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-0"
          spellCheck={false}
        />
      </div>

      {/* Flowchart Canvas */}
      <div className="flex-1 relative h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-slate-50"
          minZoom={0.1}
        >
          <Background color="#cbd5e1" gap={24} size={1.5} />
          <Controls className="bg-white shadow-md border-none rounded-lg overflow-hidden" />
          <MiniMap 
            className="bg-white shadow-md rounded-lg border-none" 
            nodeColor={(n) => {
              if (n.type === 'start' || n.type === 'end') return '#10b981';
              if (n.type === 'decision') return '#ef4444';
              if (n.type === 'io') return '#f59e0b';
              if (n.type === 'loop') return '#d946ef';
              return '#3b82f6';
            }}
          />
          <Panel position="top-right" className="m-4">
            <button 
              onClick={() => {
                alert('Функція завантаження в розробці. Використовуйте скріншот.');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 font-medium rounded-lg shadow-md hover:bg-slate-50 hover:text-slate-900 transition-colors border border-slate-200"
            >
              <Download className="w-4 h-4" />
              <span>Експорт</span>
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
