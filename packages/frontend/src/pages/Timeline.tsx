import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Filter, X } from 'lucide-react';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { EvidenceChip } from '../components/EvidenceChip';

const eventColors: Record<string, string> = {
  AUTH: '#3b82f6', LOGIN: '#3b82f6', LOGOUT: '#6366f1',
  WEB_VISIT: '#06b6d4', SEARCH: '#0ea5e9',
  FILE_DOWNLOAD: '#22c55e', FILE_CREATE: '#16a34a', FILE_MODIFY: '#84cc16', FILE_DELETE: '#ef4444', FILE_UPLOAD: '#f97316',
  PROCESS_START: '#a855f7', PROCESS_END: '#7c3aed',
  NETWORK_CONNECTION: '#f97316', COMMAND_EXECUTION: '#ec4899',
  EMAIL_RECEIVED: '#8b5cf6', EMAIL_SENT: '#6d28d9',
  AUTHENTICATION_FAILURE: '#ef4444', AUTHENTICATION_SUCCESS: '#22c55e',
  UNKNOWN: '#6b7280',
};

export const Timeline: React.FC = () => {
  const { id } = useParams();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    if (id) api.getEvents(id).then(setEvents);
  }, [id]);

  const lanes = Array.from(new Set(events.map(e => e.entity_id)));
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="h-12 border-b border-inv-border bg-inv-surface flex items-center px-4 gap-4 shrink-0">
        <Filter size={14} className="text-inv-muted" />
        <span className="text-sm font-medium">Timeline Filters</span>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto relative bg-inv-bg p-6">
          <div className="space-y-6 relative">
            {lanes.map((lane) => (
              <div key={lane} className="flex gap-4 min-h-[60px] relative">
                <div className="w-16 shrink-0 bg-inv-surface border border-inv-border rounded-md flex flex-col items-center justify-center p-2 z-10 relative">
                  <span className="text-xs font-mono font-semibold truncate w-full text-center">{lane}</span>
                  <span className="text-[10px] text-inv-muted mt-1">{events.filter(e => e.entity_id === lane).length} evts</span>
                </div>
                
                <div className="flex-1 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-inv-border -translate-y-1/2" />
                  {events.filter(e => e.entity_id === lane).map(ev => {
                    const color = eventColors[ev.event_type] || eventColors.UNKNOWN;
                    const isCorrelated = ev.correlations && ev.correlations.length > 0;
                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="absolute top-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-20"
                        style={{ left: `${Math.random() * 80 + 10}%` }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-inv-bg"
                          style={{ 
                            backgroundColor: color,
                            boxShadow: isCorrelated ? '0 0 8px #f59e0b' : 'none'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-inv-border pt-2 flex justify-between text-xs text-inv-muted px-32">
            <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
          </div>
        </div>

        {selectedEvent && (
          <div className="w-80 border-l border-inv-border bg-inv-surface flex flex-col shrink-0 animate-slide-in">
            <div 
              className="h-2 w-full"
              style={{ backgroundColor: eventColors[selectedEvent.event_type] || eventColors.UNKNOWN }}
            />
            <div className="p-4 border-b border-inv-border flex items-start justify-between">
              <div>
                <div className="text-xs font-mono text-inv-muted mb-1">{selectedEvent.id}</div>
                <h3 className="font-semibold">{selectedEvent.event_type}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-inv-muted hover:text-inv-text">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto">
              <div>
                <div className="text-xs text-inv-muted uppercase tracking-wider mb-1">Timestamp</div>
                <div className="text-sm">{new Date(selectedEvent.timestamp).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-inv-muted uppercase tracking-wider mb-1">Description</div>
                <div className="text-sm">{selectedEvent.description}</div>
              </div>
              <div>
                <div className="text-xs text-inv-muted uppercase tracking-wider mb-2">Classification</div>
                <ClassificationBadge classification={selectedEvent.classification || 'FACT'} />
              </div>
              <div>
                <div className="text-xs text-inv-muted uppercase tracking-wider mb-2">Confidence</div>
                <ConfidenceBar confidence={selectedEvent.confidence || 1.0} />
              </div>
              <div>
                <div className="text-xs text-inv-muted uppercase tracking-wider mb-2">Evidence</div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.evidence_ids?.map((eid: string) => (
                    <EvidenceChip key={eid} id={eid} />
                  ))}
                </div>
              </div>
              {selectedEvent.correlations?.length > 0 && (
                <div>
                  <div className="text-xs text-inv-muted uppercase tracking-wider mb-2">Correlations</div>
                  <div className="space-y-2">
                    {selectedEvent.correlations.map((c: any, idx: number) => (
                      <div key={idx} className="text-xs px-2 py-1.5 rounded bg-amber-950/30 text-amber-400 border border-amber-800/50">
                        {c.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
