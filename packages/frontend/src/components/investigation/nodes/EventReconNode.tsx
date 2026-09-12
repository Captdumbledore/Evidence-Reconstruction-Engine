import { Handle, Position } from '@xyflow/react';
import { Mail, File as FileIcon, Terminal, Globe, Lock, Monitor, Activity } from 'lucide-react';

interface EventReconNodeData {
  id: string;
  event_type: string;
  actor: string;
  description: string;
  timestamp: string;
  confidence: number;
  source_type: string;
  evidenceIds: string[];
  isKeyChain?: boolean;
}

const SOURCE_COLORS: Record<string, string> = {
  email: '#8b5cf6',
  filesystem: '#22c55e',
  file: '#22c55e',
  process: '#f97316',
  network: '#e11d2e',
  auth: '#3b82f6',
  browser: '#06b6d4',
  default: '#8b8d94'
};

const getIcon = (type: string, source: string) => {
  const t = type.toUpperCase();
  const s = source.toLowerCase();
  if (t.startsWith('EMAIL_')) return Mail;
  if (t.startsWith('FILE_') || s === 'filesystem') return FileIcon;
  if (t.startsWith('PROCESS_')) return Terminal;
  if (t.startsWith('NETWORK_') || s === 'network') return Globe;
  if (t.startsWith('AUTH_') || s === 'auth') return Lock;
  if (t.startsWith('BROWSER_') || s === 'browser') return Monitor;
  return Activity;
};

export const EventReconNode = ({ data, isConnectable }: { data: EventReconNodeData; isConnectable: boolean }) => {
  const color = SOURCE_COLORS[data.source_type?.toLowerCase()] || SOURCE_COLORS.default;
  const Icon = getIcon(data.event_type || '', data.source_type || '');
  
  const timeStr = data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour12: false }) : '';
  
  const conf = data.confidence || 0;
  const dotColor = conf > 0.8 ? 'bg-green-500' : conf >= 0.5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div 
      className="relative w-[180px] bg-inv-surface rounded border border-inv-border2 flex flex-col"
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-inv-muted !border-none !w-2 !h-2" />
      
      {/* Top accent strip */}
      <div className="h-[3px] w-full rounded-t" style={{ backgroundColor: color }} />
      
      <div className="p-2 space-y-1">
        <div className="flex items-center justify-between">
          <Icon size={12} style={{ color }} />
          <span className="font-mono text-[10px] text-inv-muted">{timeStr}</span>
        </div>
        
        <div className="text-xs font-bold text-white truncate" title={data.event_type}>
          {data.event_type}
        </div>
        
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
          <div className="text-xs text-inv-text truncate max-w-[140px]" title={data.actor}>
            {data.actor || 'Unknown Actor'}
          </div>
        </div>
        
        {data.evidenceIds && data.evidenceIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {data.evidenceIds.map(eid => (
              <span key={eid} className="px-1 py-0.5 text-[8px] bg-inv-surface2 text-inv-muted rounded border border-inv-border">
                {eid}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-inv-muted !border-none !w-2 !h-2" />
    </div>
  );
};
