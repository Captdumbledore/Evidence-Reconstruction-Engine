import { Handle, Position } from '@xyflow/react';
import { User, Server, Globe, File, Cpu, Network, Mail } from 'lucide-react';

const icons: Record<string, any> = {
  PERSON: User,
  DEVICE: Server,
  IP: Globe,
  FILE: File,
  PROCESS: Cpu,
  DOMAIN: Network,
  EMAIL: Mail,
};

const typeColors: Record<string, string> = {
  PERSON: '#e11d2e',  // red - human actor
  DEVICE: '#6366f1',  // indigo - device
  IP: '#f97316',      // orange - network
  DOMAIN: '#f97316',  // orange - network
  FILE: '#22c55e',    // green - artifact  
  PROCESS: '#a855f7', // purple - process
  EMAIL: '#8b5cf6',   // violet - communication
};

export const EntityNode = ({ data }: any) => {
  const Icon = icons[data.entityType] || Network;
  const accentColor = typeColors[data.entityType] || '#292a30';
  const isPerson = data.entityType === 'PERSON';
  
  return (
    <div 
      className={`bg-inv-surface border rounded p-2 flex items-center gap-3 min-w-[160px] shadow-md ${isPerson ? 'rounded-full' : ''}`}
      style={{ borderColor: accentColor }}
    >
      <Handle type="target" position={Position.Top} className="!bg-inv-muted !border-inv-bg" />
      <div 
        className={`w-8 h-8 bg-inv-bg border border-inv-border flex items-center justify-center ${isPerson ? 'rounded-full' : 'rounded'}`}
      >
        <Icon size={14} style={{ color: accentColor }} />
      </div>
      <div className={isPerson ? 'pr-2' : ''}>
        <div className="text-[10px] text-inv-muted font-mono">{data.entityType}</div>
        <div className="text-sm font-medium text-white">{data.label}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-inv-muted !border-inv-bg" />
    </div>
  );
};
