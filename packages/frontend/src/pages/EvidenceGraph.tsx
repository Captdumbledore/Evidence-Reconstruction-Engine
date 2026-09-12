import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow, Background, Controls, Node,
  useNodesState, useEdgesState, BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../lib/api';
import { User, Monitor, Globe, Wifi, File as FileIcon, Terminal, Mail, X, Filter } from 'lucide-react';

const nodeTypesConfig: Record<string, { icon: any, color: string }> = {
  userNode: { icon: User, color: '#3b82f6' },
  deviceNode: { icon: Monitor, color: '#64748b' },
  domainNode: { icon: Globe, color: '#ef4444' },
  ipNode: { icon: Wifi, color: '#f97316' },
  fileNode: { icon: FileIcon, color: '#22c55e' },
  processNode: { icon: Terminal, color: '#a855f7' },
  emailNode: { icon: Mail, color: '#6366f1' },
};

const CustomNode = ({ data, icon: Icon, color }: any) => (
  <div className="px-3 py-2 rounded-lg border-2 bg-inv-surface min-w-[120px] text-center shadow-lg"
    style={{ borderColor: color }}>
    <div className="flex items-center justify-center mb-1">
      <Icon size={14} style={{ color }} />
    </div>
    <div className="text-xs font-mono font-semibold text-inv-text truncate max-w-[140px]">{data.label}</div>
    <div className="text-[10px] text-inv-muted mt-0.5">{data.nodeType} · {data.eventCount || 0} events</div>
  </div>
);

const customNodeTypes = Object.entries(nodeTypesConfig).reduce((acc, [type, config]) => {
  acc[type] = (props: any) => <CustomNode {...props} icon={config.icon} color={config.color} />;
  return acc;
}, {} as any);

export const EvidenceGraph: React.FC = () => {
  const { id } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    if (id) {
      api.getGraph(id).then(g => {
        setNodes(g.nodes.map((n: any) => ({
          ...n,
          type: `${n.data.nodeType.toLowerCase()}Node`
        })));
        setEdges(g.edges);
      });
    }
  }, [id, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => setSelectedNode(node), []);

  return (
    <div className="flex h-full bg-inv-bg relative">
      {/* Left panel: Filters */}
      <div className="absolute left-4 top-4 w-48 bg-inv-surface border border-inv-border rounded-lg shadow-xl z-10 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-3 flex items-center gap-2">
          <Filter size={12} /> Entity Types
        </h3>
        <div className="space-y-2">
          {Object.entries(nodeTypesConfig).map(([type, { color }]) => (
            <label key={type} className="flex items-center gap-2 text-xs text-inv-text cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-inv-border bg-inv-bg text-blue-500" />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {type.replace('Node', '')}
            </label>
          ))}
        </div>
      </div>

      <div className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={customNodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          className="bg-inv-bg"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#30363d" />
          <Controls className="bg-inv-surface border-inv-border fill-inv-text" />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-inv-surface border-l border-inv-border shadow-2xl animate-slide-in flex flex-col z-20">
          <div className="p-4 border-b border-inv-border flex items-center justify-between">
            <h3 className="font-semibold text-sm">Entity Details</h3>
            <button onClick={() => setSelectedNode(null)} className="text-inv-muted hover:text-inv-text"><X size={16}/></button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs text-inv-muted uppercase">ID</div>
              <div className="text-sm font-mono">{selectedNode.id}</div>
            </div>
            <div>
              <div className="text-xs text-inv-muted uppercase">Label</div>
              <div className="text-sm font-medium">{selectedNode.data.label}</div>
            </div>
            <div>
              <div className="text-xs text-inv-muted uppercase">Type</div>
              <div className="text-sm">{selectedNode.data.nodeType}</div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-inv-surface border border-inv-border rounded-lg px-4 py-2 flex gap-4 text-xs z-10 shadow-lg">
        {Object.entries(nodeTypesConfig).slice(0,4).map(([type, { color, icon: Icon }]) => (
          <div key={type} className="flex items-center gap-1.5">
            <Icon size={12} style={{ color }} />
            <span className="text-inv-muted">{type.replace('Node', '')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
