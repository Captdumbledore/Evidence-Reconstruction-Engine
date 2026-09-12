import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow, Background, Controls, applyNodeChanges, applyEdgeChanges, addEdge,
  Node, Edge, ConnectionMode, MarkerType, ReactFlowProvider, useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { EventReconNode } from '../components/investigation/nodes/EventReconNode';
import { EvidenceNode } from '../components/investigation/nodes/EvidenceNode';
import { EntityNode } from '../components/investigation/nodes/EntityNode';
import { ClueDrawer } from '../components/investigation/ClueDrawer';
import { TheoryPanel } from '../components/investigation/TheoryPanel';
import { TimelineStrip } from '../components/investigation/TimelineStrip';
import { CaseIntro } from '../components/investigation/CaseIntro';

import { api } from '../lib/api';

const PhaseNode = ({ data }: any) => {
  return (
    <div className="w-full h-full bg-inv-surface/20 border-2 border-inv-border/50 rounded-lg pointer-events-none flex flex-col">
      <div className="bg-inv-surface p-2 border-b-2 border-inv-border/50 font-mono text-xs font-bold text-inv-text uppercase pointer-events-auto">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  EVENT_RECON: EventReconNode,
  EVIDENCE: EvidenceNode,
  ENTITY: EntityNode,
  PHASE: PhaseNode,
};

const KEYWORDS = ['email', 'download', 'winword', 'cmd', 'network', 'connect'];

const InvestigationBoardInner: React.FC = () => {
  const { id } = useParams();
  const [showIntro, setShowIntro] = useState(true);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isInvestigateMode, setIsInvestigateMode] = useState(false);
  const [theory, setTheory] = useState<any>(null); // For legacy
  const [findings, setFindings] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  
  const [showReconDetected, setShowReconDetected] = useState(false);
  const [, setUserConnectionCount] = useState(0);

  const [rawEvents, setRawEvents] = useState<any[]>([]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const buildGraph = useCallback((events: any[], investigateMode: boolean, showAll: boolean) => {
    let sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (!showAll && sortedEvents.length > 30) {
      sortedEvents = sortedEvents.slice(0, 30);
    }

    const processedNodes: Node[] = [];
    const processedEdges: Edge[] = [];

    const phases = [
      { id: 'phase-delivery', label: 'PHASE 1: DELIVERY & INITIAL ACCESS', y: 0 },
      { id: 'phase-execution', label: 'PHASE 2: EXECUTION & PERSISTENCE', y: 600 },
      { id: 'phase-c2', label: 'PHASE 3: COMMAND & CONTROL', y: 1200 },
      { id: 'phase-action', label: 'PHASE 4: ACTIONS ON OBJECTIVES', y: 1800 },
    ];

    phases.forEach((phase) => {
      processedNodes.push({
        id: phase.id,
        type: 'PHASE',
        position: { x: 50, y: phase.y },
        style: { width: 800, height: 500, zIndex: -1 },
        data: { label: phase.label },
      });
    });

    const isKeyChainEvent = (ev: any) => {
      const descLower = (ev.description || '').toLowerCase();
      return KEYWORDS.some(kw => descLower.includes(kw));
    };

    const eventsWithPhase = sortedEvents.map((ev, i) => {
      const phaseIdx = Math.min(3, Math.floor(i / Math.ceil(sortedEvents.length / 4)));
      return { ...ev, phaseId: phases[phaseIdx].id };
    });

    const keyChainEvents = eventsWithPhase.filter(ev => isKeyChainEvent(ev));
    const otherEvents = eventsWithPhase.filter(ev => !isKeyChainEvent(ev));

    const positions: Record<string, { x: number, y: number }> = {};
    const phaseKeyChainCounts: Record<string, number> = {};

    keyChainEvents.forEach((ev) => {
      const phaseId = ev.phaseId;
      phaseKeyChainCounts[phaseId] = (phaseKeyChainCounts[phaseId] || 0) + 1;
      const i = phaseKeyChainCounts[phaseId] - 1;
      positions[ev.id] = { x: 50, y: i * 150 + 50 };
    });

    const phaseOtherCounts: Record<string, number> = {};
    otherEvents.forEach((ev) => {
      const phaseId = ev.phaseId;
      phaseOtherCounts[phaseId] = (phaseOtherCounts[phaseId] || 0) + 1;
      const count = phaseOtherCounts[phaseId];
      
      const col = 1 + ((count - 1) % 2);
      const row = Math.floor((count - 1) / 2);
      positions[ev.id] = { x: col * 220 + 50, y: row * 150 + 50 };
    });

    eventsWithPhase.forEach(ev => {
      const isKeyChain = isKeyChainEvent(ev);
      const isFaded = investigateMode && !isKeyChain;
      const isGlow = investigateMode && isKeyChain;
      
      processedNodes.push({
        id: ev.id,
        type: 'EVENT_RECON',
        parentId: ev.phaseId,
        extent: 'parent',
        position: positions[ev.id] || { x: 50, y: 50 },
        data: {
          ...ev,
          isKeyChain
        },
        style: { opacity: isFaded ? 0.25 : 1 },
        className: isGlow ? 'shadow-[0_0_15px_rgba(225,29,46,0.5)] border border-inv-red rounded-lg' : undefined
      });
    });

    const getEntities = (desc: string) => {
      if (!desc) return [];
      const words = desc.split(/[\s,"':;[\]]+/);
      return words.filter(w => w.includes('.') && w.length > 4).map(w => w.toLowerCase());
    };

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const ev1 = sortedEvents[i];
      const ev2 = sortedEvents[i + 1];

      const isKeyChain1 = isKeyChainEvent(ev1);
      const isKeyChain2 = isKeyChainEvent(ev2);
      const isKeyChainEdge = isKeyChain1 && isKeyChain2;

      const entities1 = getEntities(ev1.description);
      const entities2 = getEntities(ev2.description);
      const sharesEntity = entities1.some(e1 => entities2.includes(e1));

      if ((ev1.actor === ev2.actor && ev1.actor) || sharesEntity) {
        const emphasize = investigateMode && isKeyChainEdge;
        
        let strokeColor = '#292a30';
        let strokeWidth = investigateMode ? 0.5 : 1.5;
        let opacity = investigateMode ? 0.2 : 1.0;
        
        if (emphasize) {
          strokeColor = '#e11d2e';
          strokeWidth = 2.5;
          opacity = 1.0;
        }

        processedEdges.push({
          id: `e-${ev1.id}-${ev2.id}`,
          source: ev1.id,
          target: ev2.id,
          type: isKeyChainEdge ? 'straight' : 'smoothstep',
          animated: false,
          label: emphasize ? 'Related Sequence' : undefined,
          labelStyle: emphasize ? { fill: '#e11d2e', fontWeight: 'bold', fontSize: 10 } : undefined,
          labelBgStyle: emphasize ? { fill: '#17181c' } : undefined,
          style: {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            opacity: opacity
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }
        });
      }
    }

    return { nodes: processedNodes, edges: processedEdges };
  }, []);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchGraphData = () => {
    if (!id) return;
    api.getEvents(id).then((eventsData: any) => {
      if (!eventsData) return;
      setRawEvents(eventsData);
      setAllEvents(eventsData);
    }).catch(err => console.error(err));
    
    api.getFindings(id).then((findingsData: any) => {
      if (findingsData && Array.isArray(findingsData)) {
        setFindings(findingsData);
        if (findingsData.length > 0) {
          setTheory(findingsData[0]); // fallback
        }
      }
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchGraphData();
  }, [id]);

  const handleReevaluate = async () => {
    if (!id) return;
    setIsAnalyzing(true);
    try {
      await api.analyzeCase(id);
      fetchGraphData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const highlightedIdsRef = useRef<string[]>([]);
  useEffect(() => {
    highlightedIdsRef.current = highlightedIds;
  }, [highlightedIds]);

  useEffect(() => {
    if (rawEvents.length === 0) return;
    const { nodes: newNodes, edges: newEdges } = buildGraph(rawEvents, isInvestigateMode, showAllEvents);
    // Merge dragged nodes with graph nodes
    setNodes(nds => {
      const draggedNodes = nds.filter(n => !rawEvents.some(re => re.id === n.id) && n.type !== 'PHASE');
      return [...newNodes, ...draggedNodes].map(node => {
        const isHighlighted = highlightedIdsRef.current.includes(node.id) || highlightedIdsRef.current.includes(node.data?.id as string);
        let cn = (node.className || '').replace(/shadow-\[0_0_20px_rgba\(234,179,8,0\.8\)\] border border-yellow-500 rounded-lg/g, '').trim();
        if (isHighlighted) cn = `${cn} shadow-[0_0_20px_rgba(234,179,8,0.8)] border border-yellow-500 rounded-lg`.trim();
        return { ...node, className: cn };
      });
    });
    setEdges(newEdges);
  }, [rawEvents, isInvestigateMode, showAllEvents, buildGraph]);

  // Apply highlighting
  useEffect(() => {
    setNodes(nds => nds.map(node => {
      const isHighlighted = highlightedIds.includes(node.id) || highlightedIds.includes(node.data?.id as string);
      let cn = (node.className || '').replace(/shadow-\[0_0_20px_rgba\(234,179,8,0\.8\)\] border border-yellow-500 rounded-lg/g, '').trim();
      if (isHighlighted) {
        cn = `${cn} shadow-[0_0_20px_rgba(234,179,8,0.8)] border border-yellow-500 rounded-lg`.trim();
      }
      if (node.className === cn) return node;
      return { ...node, className: cn };
    }));
  }, [highlightedIds]);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback((params: any) => {
    setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: '#e11d2e', strokeWidth: 2.5 } }, eds));
    setUserConnectionCount(c => {
      const newCount = c + 1;
      if (newCount >= 3) setShowReconDetected(true);
      return newCount;
    });
  }, []);
  
  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedEvent(node.data);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    if (!reactFlowWrapper.current) return;
    
    const dataStr = event.dataTransfer.getData('application/reactflow');
    if (!dataStr) return;
    
    try {
      const { type, data } = JSON.parse(dataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const isHighlighted = highlightedIdsRef.current.includes(`dropped-${data.id || ''}`) || highlightedIdsRef.current.includes(data.id);
      
      const newNode = {
        id: `dropped-${data.id || Date.now()}`,
        type,
        position,
        data,
        className: isHighlighted ? 'shadow-[0_0_20px_rgba(234,179,8,0.8)] border border-yellow-500 rounded-lg' : undefined
      };

      setNodes((nds) => nds.concat(newNode as any));
    } catch (e) {
      console.error('Failed to parse dropped data', e);
    }
  }, [reactFlowInstance]);

  return (
    <div className="relative w-full h-full bg-inv-bg flex flex-col overflow-hidden">
      {showIntro && <CaseIntro onComplete={() => setShowIntro(false)} />}
      
      {/* Top Bar for Mode Toggle */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center bg-inv-surface rounded-md p-1 ${isInvestigateMode ? 'shadow-[0_0_20px_rgba(225,29,46,0.3)] border border-inv-red' : 'border border-inv-border'}`}>
        <button 
          onClick={() => setIsInvestigateMode(false)}
          className={`px-4 py-1.5 text-xs font-bold font-mono rounded ${!isInvestigateMode ? 'bg-inv-surface2 text-white' : 'text-inv-muted hover:text-white'}`}
        >
          EXPLORE
        </button>
        <button 
          onClick={() => setIsInvestigateMode(true)}
          className={`px-4 py-1.5 text-xs font-bold font-mono rounded ${isInvestigateMode ? 'bg-inv-red text-white' : 'text-inv-muted hover:text-white'}`}
        >
          INVESTIGATE
        </button>
      </div>

      {isInvestigateMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 text-[10px] font-mono text-inv-red animate-pulse z-10">
          INVESTIGATE MODE — {nodes.filter(n => n.data?.isKeyChain).length} KEY CHAIN EVENTS IDENTIFIED
        </div>
      )}

      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-inv-bg"
        >
          <Background color="#292a30" gap={20} size={1} />
          <Controls className="!bg-inv-surface !border-inv-border !text-inv-text" />
          
          <div className="absolute top-4 right-4 z-10">
            {allEvents.length > 30 && (
              <button
                onClick={() => setShowAllEvents(!showAllEvents)}
                className="px-3 py-1.5 bg-inv-surface border border-inv-border text-inv-text text-xs rounded hover:bg-inv-surface2"
              >
                {showAllEvents ? 'Show First 30 Events' : `Show all ${allEvents.length} events`}
              </button>
            )}
          </div>
        </ReactFlow>
        
        {isInvestigateMode && (
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(225,29,46,0.15)] z-0" />
        )}
        
        {showReconDetected && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-inv-bg border-2 border-inv-red rounded-lg p-8 text-center shadow-2xl shadow-inv-red/20 animate-fade-in">
            <div className="text-inv-red font-mono text-xs tracking-widest mb-2">RECONSTRUCTION DETECTED</div>
            <div className="text-white text-lg font-bold mb-1">Potential phishing-to-execution sequence</div>
            <div className="text-inv-muted text-sm mb-4">Confidence: 78%</div>
            <button onClick={() => setShowReconDetected(false)} className="px-6 py-2 bg-inv-red hover:bg-inv-red-bright text-white text-sm font-bold rounded transition-colors">
              EXAMINE THEORY
            </button>
          </div>
        )}

        <ClueDrawer caseId={id!} nodes={nodes} onEventSelect={setSelectedEvent} onInvestigate={setHighlightedIds} />
        <TheoryPanel theory={theory} selectedEvent={selectedEvent} findings={findings} onReevaluate={handleReevaluate} isAnalyzing={isAnalyzing} />
        <TimelineStrip />
      </div>
    </div>
  );
};

export const InvestigationBoard = () => (
  <ReactFlowProvider>
    <InvestigationBoardInner />
  </ReactFlowProvider>
);

