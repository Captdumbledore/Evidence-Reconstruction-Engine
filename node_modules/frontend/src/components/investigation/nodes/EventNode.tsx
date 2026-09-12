import { Handle, Position } from '@xyflow/react';
import { Clock } from 'lucide-react';

export const EventNode = ({ data }: any) => {
  return (
    <div className="bg-inv-bg border border-inv-muted/30 rounded-full py-1.5 px-4 min-w-[150px] shadow-lg flex items-center gap-2">
      <Handle type="target" position={Position.Left} className="!bg-inv-muted !border-inv-bg" />
      <Clock size={12} className="text-inv-muted" />
      <div className="flex-1 flex flex-col">
        <span className="text-[10px] text-inv-muted font-mono">{data.timestamp || '00:00'}</span>
        <span className="text-xs font-medium text-white">{data.label}</span>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-inv-muted !border-inv-bg" />
    </div>
  );
};
