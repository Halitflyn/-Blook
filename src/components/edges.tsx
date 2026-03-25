import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { useState, useRef, useEffect } from 'react';

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: any) {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
  });

  const [localOffset, setLocalOffset] = useState(data?.offset || { x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setLocalOffset(data?.offset || { x: 0, y: 0 });
  }, [data?.offset]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX - localOffset.x, y: e.clientY - localOffset.y };
    setIsDragging(true);
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setLocalOffset({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
      e.stopPropagation();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    if (data?.onOffsetChange) {
      data.onOffsetChange(data.id, localOffset);
    }
    e.stopPropagation();
  };

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={style} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX + localOffset.x}px, ${labelY + localOffset.y}px)`,
              pointerEvents: 'all',
            }}
            className={`nodrag nopan bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-600 shadow-sm transition-shadow ${
              isDragging ? 'cursor-grabbing shadow-md ring-2 ring-blue-400' : 'cursor-grab hover:shadow-md'
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
