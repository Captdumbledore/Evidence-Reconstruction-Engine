import { AlertTriangle, CheckCircle, HelpCircle, ArrowLeft, Shield, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';

const EVENT_COLORS: Record<string, string> = {
  email: 'bg-[#8b5cf6]',
  filesystem: 'bg-[#22c55e]',
  file: 'bg-[#22c55e]',
  process: 'bg-[#f97316]',
  network: 'bg-[#e11d2e]',
  auth: 'bg-[#3b82f6]',
  browser: 'bg-[#06b6d4]',
  default: 'bg-[#8b8d94]'
};

export const TheoryPanel = ({ theory: initialTheory, selectedNode, selectedEvent, findings = [], onReevaluate, isAnalyzing, onCloseDetail }: any) => {
  const [selectedTheory, setSelectedTheory] = useState<any>(null);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedNode || selectedEvent) setSelectedTheory(null);
  }, [selectedNode, selectedEvent]);

  const handleClose = () => {
    setSelectedTheory(null);
    if (onCloseDetail) onCloseDetail();
  };

  if (!selectedNode && !selectedEvent && findings.length === 0 && !initialTheory) return null;

  const theories = findings.length > 0 ? findings : (initialTheory ? [initialTheory] : []);

  const handleUpdate = (id: string, status: string) => {
    setStatusMap(prev => ({ ...prev, [id]: status }));
    api.updateFinding(id, status);
  };

  if (selectedEvent) {
    const color = EVENT_COLORS[selectedEvent.source_type?.toLowerCase()] || EVENT_COLORS.default;
    const conf = selectedEvent.confidence || 0;
    const confBars = Math.round(conf * 10);
    const barsStr = '█'.repeat(confBars) + '░'.repeat(10 - confBars);

    return (
      <div className="absolute right-4 top-4 w-80 bg-inv-surface border border-inv-border rounded-lg shadow-2xl flex flex-col z-10 overflow-hidden">
        <div className="p-3 bg-inv-surface2 border-b border-inv-border flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold tracking-wider text-inv-text uppercase">EVENT DETAIL</h3>
          <button 
            onClick={handleClose} 
            className="text-inv-muted hover:text-white p-1 rounded hover:bg-inv-surface transition-colors"
            title="Close & return to theories"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white border border-inv-border2" style={{ backgroundColor: color }}>
            {selectedEvent.event_type || selectedEvent.source_type || 'EVENT'}
          </div>
          
          <div className="text-white text-sm font-semibold leading-relaxed">
            {selectedEvent.description || selectedEvent.title || 'No description provided'}
          </div>
          
          <div className="space-y-1.5 pt-2 border-t border-inv-border2">
            <div className="text-xs text-inv-muted">
              <span className="font-bold text-inv-text uppercase inline-block w-24">TIMESTAMP:</span>
              <span className="font-mono">{selectedEvent.timestamp ? new Date(selectedEvent.timestamp).toLocaleTimeString([], { hour12: false }) : 'N/A'}</span>
            </div>
            <div className="text-xs text-inv-muted">
              <span className="font-bold text-inv-text uppercase inline-block w-24">ACTOR:</span>
              {selectedEvent.actor || 'Unknown'}
            </div>
            <div className="text-xs text-inv-muted">
              <span className="font-bold text-inv-text uppercase inline-block w-24">SOURCE:</span>
              {selectedEvent.source_type || 'N/A'}
            </div>
            <div className="text-xs text-inv-muted flex items-center">
              <span className="font-bold text-inv-text uppercase inline-block w-24">CONFIDENCE:</span>
              <span className="font-mono text-[10px] tracking-tighter text-inv-text mr-1">{barsStr}</span>
              <span className="font-mono">{Math.round(conf * 100)}%</span>
            </div>
          </div>

          {selectedEvent.evidenceIds && selectedEvent.evidenceIds.length > 0 && (
            <div className="pt-4 border-t border-inv-border2">
              <div className="text-[10px] font-mono text-inv-muted mb-2 uppercase flex items-center gap-1">
                <Shield size={10} /> SUPPORTING EVIDENCE
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedEvent.evidenceIds.map((eid: string) => (
                  <span key={eid} className="px-2 py-1 bg-inv-surface2 text-white text-[10px] rounded border border-inv-border hover:border-inv-muted cursor-pointer transition-colors">
                    [{eid}]
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedNode) {
    return (
      <div className="absolute right-4 top-4 w-80 bg-inv-surface border border-inv-border rounded-lg shadow-2xl flex flex-col z-10 overflow-hidden">
        <div className="p-3 bg-inv-surface2 border-b border-inv-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-xs font-bold tracking-wider text-inv-text uppercase">NODE DETAIL</h3>
            <span className="text-xs font-mono font-bold text-inv-muted">{selectedNode.data?.nodeType || selectedNode.data?.entityType || selectedNode.type}</span>
          </div>
          <button 
            onClick={handleClose} 
            className="text-inv-muted hover:text-white p-1 rounded hover:bg-inv-surface transition-colors"
            title="Close & return to theories"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="text-white text-sm font-semibold">{selectedNode.data?.label}</div>
          <div className="text-xs text-inv-muted">
            <span className="font-bold text-inv-text">ID:</span> {selectedNode.id}
          </div>
          {selectedNode.data?.description && (
            <div className="text-xs text-inv-text">{selectedNode.data.description}</div>
          )}
          <div className="text-xs text-inv-muted">
            <span className="font-bold text-inv-text">Confidence:</span> {Math.round((selectedNode.data?.confidence || 0) * 100)}%
          </div>
          {selectedNode.data?.eventCount !== undefined && (
            <div className="text-xs text-inv-muted">
              <span className="font-bold text-inv-text">Events:</span> {selectedNode.data.eventCount}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!selectedTheory && theories.length > 0) {
    return (
      <div className="absolute right-4 top-4 w-80 bg-inv-surface border border-inv-border rounded-lg shadow-2xl flex flex-col z-10 overflow-hidden max-h-[80vh]">
        <div className="p-3 bg-inv-surface2 border-b border-inv-border flex justify-between items-center">
          <h3 className="font-mono text-xs font-bold tracking-wider text-white uppercase">Theories ({theories.length})</h3>
          {onReevaluate && (
            <button onClick={onReevaluate} disabled={isAnalyzing} className={`text-[10px] bg-inv-bg border border-inv-border px-2 py-1 rounded font-mono transition-colors ${isAnalyzing ? 'text-inv-muted cursor-not-allowed opacity-50' : 'hover:border-inv-muted text-inv-text hover:text-white'}`}>
              {isAnalyzing ? 'ANALYZING...' : 'RE-EVALUATE'}
            </button>
          )}
        </div>
        <div className="p-3 overflow-y-auto space-y-3">
          {theories.map((t: any, idx: number) => (
            <div key={t.id || idx} className="p-3 bg-inv-bg border border-inv-border rounded cursor-pointer hover:border-inv-red transition-colors" onClick={() => setSelectedTheory(t)}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold text-inv-red-bright uppercase">{t.classification || 'THEORY'}</span>
                <span className="text-[10px] font-mono text-inv-muted">{Math.round((t.confidence || 0) * 100)}%</span>
              </div>
              <div className="text-sm font-semibold text-white line-clamp-2">{t.description || 'Potential sequence detected'}</div>
              <button className="mt-3 w-full py-1 text-[10px] font-bold text-inv-text bg-inv-surface2 rounded hover:bg-inv-surface transition-colors">
                EXAMINE THEORY
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const theory = selectedTheory || initialTheory;
  const currentStatus = statusMap[theory.id] || theory.status || 'pending';

  return (
    <div className="absolute right-4 top-4 w-80 bg-inv-surface border border-inv-border rounded-lg shadow-2xl flex flex-col z-10 overflow-hidden max-h-[80vh]">
      <div className="p-3 bg-inv-red-deep/20 border-b border-inv-red/30 flex items-center justify-between">
        <button onClick={() => setSelectedTheory(null)} className="mr-2 text-inv-red-bright hover:text-white"><ArrowLeft size={14}/></button>
        <h3 className="flex-1 font-mono text-xs font-bold tracking-wider text-inv-red-bright uppercase line-clamp-1">{theory.classification || 'THEORY GENERATED'}</h3>
        <span className="text-xs font-mono font-bold text-inv-red-bright ml-2">{Math.round((theory.confidence || 0) * 100)}%</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-sm font-semibold text-white mb-4">{theory.description || 'Potential sequence detected'}</h4>
        
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-mono text-inv-muted mb-2 uppercase">What We Know</div>
            <ul className="space-y-1.5">
              {(theory.supporting ? theory.supporting.split(',') : ['Evidence supports this theory']).map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-inv-text">
                  <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                  <span>{point.trim()}</span>
                </li>
              ))}
            </ul>
          </div>

          {theory.classification === 'INFERENCE' && (
            <div>
              <div className="text-[10px] font-mono text-amber-500 mb-2 uppercase">What We Infer</div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-inv-text">
                  <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  <span>{theory.description}</span>
                </li>
              </ul>
            </div>
          )}

          <div>
            <div className="text-[10px] font-mono text-inv-muted mb-2 uppercase">What We Don't Know</div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-inv-text">
                <HelpCircle size={12} className="text-inv-muted mt-0.5 shrink-0" />
                <span>{theory.contradicting || 'No contradictory evidence recorded'}</span>
              </li>
            </ul>
          </div>
          
          {theory.evidenceRefs && theory.evidenceRefs.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-inv-muted mb-2 uppercase">Evidence</div>
              <div className="flex flex-wrap gap-1">
                {theory.evidenceRefs.map((ref: string) => (
                  <span key={ref} className="px-2 py-0.5 bg-inv-surface2 text-inv-text text-[10px] rounded border border-inv-border">{ref}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3 border-t border-inv-border bg-inv-bg flex flex-wrap gap-2">
        <button 
          onClick={() => handleUpdate(theory.id, 'accepted')} 
          className={`flex-1 py-1.5 text-[10px] font-semibold rounded transition-colors ${currentStatus === 'accepted' ? 'bg-green-500 text-white' : 'bg-inv-surface2 hover:bg-inv-border text-white border border-inv-border'} ${(currentStatus !== 'pending' && currentStatus !== 'accepted') ? 'opacity-50' : ''}`}
        >
          {currentStatus === 'accepted' ? '✓ ACCEPTED' : 'ACCEPT'}
        </button>
        <button 
          onClick={() => handleUpdate(theory.id, 'rejected')} 
          className={`flex-1 py-1.5 text-[10px] font-semibold rounded transition-colors ${currentStatus === 'rejected' ? 'bg-red-500 text-white' : 'bg-inv-surface2 hover:bg-inv-border text-white border border-inv-border'} ${(currentStatus !== 'pending' && currentStatus !== 'rejected') ? 'opacity-50' : ''}`}
        >
          {currentStatus === 'rejected' ? '✗ REJECTED' : 'REJECT'}
        </button>
        <button 
          onClick={() => handleUpdate(theory.id, 'investigating')} 
          className={`w-full py-1.5 text-[10px] font-semibold rounded transition-colors ${currentStatus === 'investigating' ? 'bg-amber-500 text-white' : 'bg-inv-surface2 hover:bg-inv-border text-white border border-inv-border'} ${(currentStatus !== 'pending' && currentStatus !== 'investigating') ? 'opacity-50' : ''}`}
        >
          NEEDS INVESTIGATION
        </button>
      </div>
    </div>
  );
};
