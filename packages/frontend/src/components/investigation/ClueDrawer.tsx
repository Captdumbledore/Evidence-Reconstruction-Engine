import { useState, useEffect } from 'react';
import { Shield, Clock, Network, HelpCircle, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import { api } from '../../lib/api';

export const ClueDrawer = ({ caseId, nodes = [], onEventSelect, onInvestigate }: { caseId: string; nodes?: any[]; onEventSelect?: (ev: any) => void; onInvestigate?: (ids: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'events' | 'entities' | 'questions'>('evidence');
  const [evidence, setEvidence] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Recent');

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (caseId) {
      api.getEvidence(caseId).then(data => setEvidence(data || []));
      api.getGraph(caseId).then((data: any) => {
        setEntities(data?.nodes || []);
      });
      api.getQuestions(caseId).then(data => setQuestions(data || []));
      api.getTimeline(caseId).then(data => {
        const events = data ? data.flatMap((l: any) => l.events || []) : [];
        setAllEvents(events);
      });
    }
  }, [caseId]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-inv-surface2 border border-l-0 border-inv-border p-2 rounded-r-md z-10"
      >
        <ChevronRight size={16} />
      </button>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isNodeOnBoard = (id: string) => nodes.some(n => n.id === id || n.data?.id === id);
  const boardNodeCount = nodes.length;

  const getFilteredItems = () => {
    let items = [];
    if (activeTab === 'evidence') items = evidence;
    else if (activeTab === 'events') items = allEvents;
    else if (activeTab === 'entities') items = entities;
    else if (activeTab === 'questions') items = questions;

    const query = searchQuery.toLowerCase();
    
    let filtered = items.filter((item: any) => {
      let textToSearch = '';
      if (activeTab === 'evidence') textToSearch = (item.title || item.id || '').toLowerCase();
      else if (activeTab === 'events') textToSearch = (item.description || item.id || '').toLowerCase();
      else if (activeTab === 'entities') textToSearch = (item.data?.label || item.label || item.id || '').toLowerCase();
      else if (activeTab === 'questions') textToSearch = (item.text || item.question || item.id || '').toLowerCase();
      
      return textToSearch.includes(query);
    });

    if (activeTab === 'evidence') {
      filtered = filtered.filter(item => {
        const onBoard = isNodeOnBoard(item.id);
        return filter === 'All' || (filter === 'Verified' && item.verified) || (filter === 'On Board' && onBoard);
      });
    } else if (activeTab === 'events') {
      filtered = filtered.filter(item => {
        const onBoard = isNodeOnBoard(item.id);
        const isImportant = (item.description || '').toLowerCase().includes('email') || (item.description || '').toLowerCase().includes('download') || (item.description || '').toLowerCase().includes('winword') || (item.description || '').toLowerCase().includes('cmd');
        return filter === 'All' || (filter === 'Important' && isImportant) || (filter === 'On Board' && onBoard);
      });
    } else if (activeTab === 'entities') {
      filtered = filtered.filter(item => {
        const isUser = (item.data?.nodeType || item.type || '').toLowerCase().includes('user');
        return filter === 'All' || (filter === 'Users' && isUser) || filter === 'Network'; 
      });
    } else if (activeTab === 'questions') {
      filtered = filtered.filter(() => filter === 'All' || filter === 'Open');
    }

    if (sort === 'Alphabetical') {
      filtered.sort((a, b) => {
        const getStr = (item: any) => {
          if (activeTab === 'evidence') return item.title || item.id || '';
          if (activeTab === 'events') return item.description || '';
          if (activeTab === 'entities') return item.data?.label || item.label || item.id || '';
          if (activeTab === 'questions') return item.text || item.question || item.id || '';
          return '';
        };
        return getStr(a).localeCompare(getStr(b));
      });
    } else if (sort === 'Recent') {
      if (activeTab === 'events') {
        filtered.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }

    return filtered;
  };

  const items = getFilteredItems();

  const renderFilterRow = () => {
    const filters: Record<string, string[]> = {
      evidence: ['All', 'Verified', 'On Board'],
      events: ['All', 'Important', 'On Board'],
      entities: ['All', 'Users', 'Network'],
      questions: ['All', 'Open']
    };

    const currentFilters = filters[activeTab] || ['All'];
    if (!currentFilters.includes(filter)) setFilter('All');

    return (
      <div className="flex items-center justify-between text-xs text-inv-muted mb-3">
        <div className="flex gap-2">
          {currentFilters.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-2 py-0.5 rounded font-mono ${filter === f ? 'bg-inv-surface2 text-white' : 'hover:bg-inv-bg'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent text-inv-muted border-none outline-none font-mono text-[10px] cursor-pointer">
          <option value="Recent">Recent</option>
          <option value="Alphabetical">Alphabetical</option>
        </select>
      </div>
    );
  };

  const renderCards = () => {
    if (items.length === 0) {
      return (
        <div className="text-center p-4 border border-inv-border border-dashed rounded bg-inv-bg">
          <p className="text-inv-muted text-xs mb-2 font-mono">NO {activeTab.toUpperCase()} CLUES. No {activeTab} match the current filter.</p>
          <button onClick={() => { setSearchQuery(''); setFilter('All'); }} className="px-3 py-1 bg-inv-surface2 text-white text-[10px] font-mono rounded hover:bg-inv-surface">
            [Clear Filters]
          </button>
        </div>
      );
    }

    if (activeTab === 'evidence') {
      return items.map((item: any) => {
        const onBoard = isNodeOnBoard(item.id);
        const expanded = expandedItems[item.id];
        return (
          <div key={item.id} 
               draggable 
               onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'EVIDENCE', data: item })); }}
               onClick={() => toggleExpand(item.id)}
               className="p-3 mb-2 bg-inv-surface2 border border-inv-border rounded cursor-pointer hover:border-inv-muted transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield size={14} className={item.verified ? "text-green-500" : "text-inv-muted"} />
                <span className="font-mono text-xs text-white truncate max-w-[150px]">{item.title || item.id}</span>
              </div>
              {onBoard && <span className="text-[9px] font-mono bg-inv-bg px-1 py-0.5 rounded text-inv-muted border border-inv-border shrink-0">ON BOARD</span>}
            </div>
            {expanded && (
              <div className="mt-2 pt-2 border-t border-inv-border text-[10px] text-inv-muted space-y-1 font-mono">
                {item.id && <div><span className="opacity-50">ID:</span> <span className="break-all">{item.id}</span></div>}
                {item.hash && <div><span className="opacity-50">HASH:</span> <span className="break-all text-green-400">{item.hash}</span></div>}
                {item.size && <div><span className="opacity-50">SIZE:</span> {item.size} bytes</div>}
                {item.type && <div><span className="opacity-50">TYPE:</span> {item.type}</div>}
              </div>
            )}
          </div>
        );
      });
    }

    if (activeTab === 'events') {
      return items.map((item: any) => {
        const descLower = (item.description || '').toLowerCase();
        const isImportant = ['email', 'download', 'winword', 'cmd', 'network', 'connect'].some(kw => descLower.includes(kw));
        return (
          <div key={item.id} 
               draggable 
               onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'EVENT_RECON', data: item })); }}
               onClick={() => onEventSelect && onEventSelect(item)}
               className={`p-3 mb-2 bg-inv-surface2 border ${isImportant ? 'border-l-2 border-inv-red' : 'border-inv-border'} rounded cursor-grab hover:border-inv-muted transition-colors`}>
            <div className="font-mono text-[10px] text-inv-muted mb-1">{new Date(item.timestamp).toLocaleString()}</div>
            <div className="text-white text-xs leading-tight font-mono">{item.description}</div>
            <div className="mt-2 text-[9px] font-mono text-inv-muted flex justify-between">
              {item.actor && <span>ACTOR: {item.actor}</span>}
              {item.classification && <span>{item.classification}</span>}
            </div>
          </div>
        );
      });
    }

    if (activeTab === 'entities') {
      return items.map((item: any) => {
        const typeStr = item.type?.replace(/Node$/i, '') || item.data?.nodeType || 'ENTITY';
        const label = item.data?.label || item.label || item.id;
        return (
          <div key={item.id} 
               draggable 
               onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'ENTITY', data: item })); }}
               className="group p-3 mb-2 bg-inv-surface2 border border-inv-border rounded cursor-grab hover:border-inv-muted transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Network size={14} className="text-indigo-400" />
              <span className="font-mono text-[9px] text-inv-muted uppercase">{typeStr}</span>
            </div>
            <div className="text-white text-xs font-mono">{label}</div>
            <div className="hidden group-hover:block mt-2 pt-2 border-t border-inv-border text-[9px] font-mono text-inv-muted">
              Relations: {item.data?.eventCount || 0} events
            </div>
          </div>
        );
      });
    }

    if (activeTab === 'questions') {
      return items.map((item: any) => (
        <div key={item.id} className="p-3 mb-2 bg-inv-surface2 border border-inv-border rounded">
          <div className="flex items-start gap-2 mb-2">
            <HelpCircle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
            <div className="text-white text-xs leading-tight font-mono">{item.text || item.question || item.id}</div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[9px] font-mono text-inv-muted">EVIDENCE: {item.evidenceRefs?.length || 0} artifacts | CONFIDENCE: {Math.round((item.confidence || 0) * 100)}%</span>
            <button onClick={() => onInvestigate?.(item.evidenceRefs || [])} className="px-2 py-1 bg-inv-bg border border-inv-border text-inv-text text-[9px] font-mono rounded hover:text-white hover:border-inv-muted transition-colors">
              [INVESTIGATE]
            </button>
          </div>
        </div>
      ));
    }

    return null;
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 max-h-full w-80 bg-inv-surface border-r border-inv-border flex flex-col z-10 shadow-xl flex-shrink-0">
      <div className="p-3 border-b border-inv-border bg-inv-bg flex items-center justify-between shrink-0">
        <h3 className="font-mono text-xs font-bold tracking-widest text-inv-text">CLUE DRAWER</h3>
        <button onClick={() => setIsOpen(false)} className="text-inv-muted hover:text-white">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="p-3 border-b border-inv-border bg-inv-surface shrink-0 space-y-3">
        <div className="text-[9px] font-mono text-inv-muted leading-relaxed uppercase">
          CLUES: {evidence.length} Evidence, {allEvents.length} Events, {entities.length} Entities, {questions.length} Questions.<br/>
          ON BOARD: {boardNodeCount} clues.
        </div>
        
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-inv-muted" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-inv-bg border border-inv-border rounded py-1 pl-8 pr-3 text-[11px] text-white focus:outline-none focus:border-inv-muted font-mono"
          />
        </div>

        <div className="flex bg-inv-bg rounded p-1">
          {[
            { id: 'evidence', label: 'EVIDENCE', count: evidence.length, icon: Shield },
            { id: 'events', label: 'EVENTS', count: allEvents.length, icon: Clock },
            { id: 'entities', label: 'ENTITIES', count: entities.length, icon: Network },
            { id: 'questions', label: 'QUESTIONS', count: questions.length, icon: HelpCircle },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setFilter('All'); }}
              className={`flex-1 py-1.5 flex flex-col items-center justify-center rounded transition-colors ${
                activeTab === tab.id ? 'bg-inv-surface2 text-white shadow-sm' : 'text-inv-muted hover:text-white'
              }`}
            >
              <tab.icon size={12} className="mb-1" />
              <span className="text-[8px] font-mono font-bold tracking-wide">{tab.label} · {tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-inv-bg custom-scrollbar">
        {renderFilterRow()}
        <div className="space-y-2">
          {renderCards()}
        </div>
      </div>
    </div>
  );
};
