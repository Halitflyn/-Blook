import { Handle, Position } from '@xyflow/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ArrowLeftRight } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function BaseNode({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center min-w-[180px] max-w-[260px] min-h-[50px] px-6 py-3 text-sm font-medium text-center break-words shadow-md", className)}>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      {children}
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export function StartNode({ data }: any) {
  return (
    <BaseNode className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full border-2 border-emerald-700 font-semibold tracking-wide shadow-lg shadow-emerald-500/20">
      {data.label}
    </BaseNode>
  );
}

export function EndNode({ data }: any) {
  return (
    <BaseNode className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-full border-2 border-emerald-700 font-semibold tracking-wide shadow-lg shadow-emerald-500/20">
      {data.label}
    </BaseNode>
  );
}

export function ProcessNode({ data }: any) {
  return (
    <BaseNode className="bg-white border-2 border-blue-500 rounded-lg text-slate-800">
      {data.label}
    </BaseNode>
  );
}

export function DecisionNode({ data }: any) {
  return (
    <div className="relative flex items-center justify-center min-w-[200px] min-h-[100px] group">
      <button
        onClick={() => data.onToggleDirection?.(data.id)}
        className="absolute -top-3 -right-3 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm hover:bg-slate-50 text-slate-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Змінити сторону виходу"
      >
        <ArrowLeftRight className="w-3 h-3" />
      </button>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="yes" className="opacity-0" />
      <Handle type="source" position={data.isFlipped ? Position.Left : Position.Right} id="no" className="opacity-0" />
      <svg className="absolute inset-0 w-full h-full drop-shadow-sm" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon points="50,0 100,50 50,100 0,50" fill="white" stroke="#ef4444" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <span className="relative z-10 max-w-[150px] font-semibold text-red-700 text-[13px] leading-snug text-center px-4">
        {data.label}
      </span>
    </div>
  );
}

export function IONode({ data }: any) {
  return (
    <div className="relative flex items-center justify-center min-w-[180px] min-h-[50px]">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div className="absolute inset-0 bg-white border-2 border-amber-500 rounded shadow-md -skew-x-12"></div>
      <span className="relative z-10 text-slate-800 font-medium px-8 py-3 text-sm text-center">
        {data.label}
      </span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}

export function LoopNode({ data }: any) {
  return (
    <div className="relative flex items-center justify-center min-w-[180px] max-w-[260px] min-h-[50px] px-6 py-3 text-sm font-medium text-center break-words shadow-md bg-white border-y-4 border-y-fuchsia-500 border-x border-x-slate-200 rounded-2xl text-fuchsia-900 font-semibold group">
      <button
        onClick={() => data.onToggleDirection?.(data.id)}
        className="absolute -top-3 -right-3 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm hover:bg-slate-50 text-slate-500 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Змінити сторону виходу"
      >
        <ArrowLeftRight className="w-3 h-3" />
      </button>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={data.isFlipped ? Position.Right : Position.Left} id="back" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="yes" className="opacity-0" />
      <Handle type="source" position={data.isFlipped ? Position.Left : Position.Right} id="no" className="opacity-0" />
      {data.label}
    </div>
  );
}

export function DummyNode() {
  return (
    <div className="w-3 h-3 bg-slate-400 rounded-full border-2 border-white shadow-sm z-10 relative">
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}
