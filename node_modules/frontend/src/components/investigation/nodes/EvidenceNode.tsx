import { Handle, Position } from '@xyflow/react';
import { Shield } from 'lucide-react';

export const EvidenceNode = ({ data }: any) => {
  return (
    <div className="bg-inv-surface2 border border-inv-border rounded-lg p-3 min-w-[200px] shadow-lg shadow-black/50">
      <Handle type="target" position={Position.Top} className="!bg-inv-muted !border-inv-bg" />
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-inv-border">
        <Shield size={14} className="text-inv-text" />
        <span className="text-xs font-mono font-semibold text-inv-text">{data.type || 'EVIDENCE'}</span>
        {data.confidence && (
          <span className="ml-auto text-[10px] text-inv-muted bg-inv-bg px-1.5 py-0.5 rounded">
            {data.confidence}%
          </span>
        )}
      </div>
      <div className="text-sm font-medium text-white mb-1">{data.label}</div>
      {data.description && <div className="text-xs text-inv-muted line-clamp-2">{data.description}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-inv-muted !border-inv-bg" />
    </div>
  );
};
