import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { EvidenceChip } from '../components/EvidenceChip';

const CLASS_COLORS: Record<string, string> = {
  FACT: 'bg-blue-500', CORRELATED: 'bg-purple-500',
  INFERENCE: 'bg-amber-500', UNKNOWN: 'bg-gray-500'
};

export const Findings: React.FC = () => {
  const { id } = useParams();
  const [findings, setFindings] = useState<any[]>([]);

  useEffect(() => {
    if (id) api.getFindings(id).then(setFindings);
  }, [id]);

  const updateStatus = async (fId: string, status: string) => {
    await api.updateFinding(fId, status);
    setFindings(prev => prev.map(f => f.id === fId ? { ...f, status } : f));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-6 border-b border-inv-border pb-4">
        <h1 className="text-xl font-bold">Investigation Findings</h1>
        <p className="text-sm text-inv-muted mt-1">Hypotheses and established facts for case {id}</p>

      </div>

      <div className="space-y-6">
        {findings.map(f => {
          const colorClass = CLASS_COLORS[f.classification] || CLASS_COLORS.UNKNOWN;
          return (
            <div key={f.id} className="panel flex overflow-hidden group">
              <div className={`w-1 shrink-0 ${colorClass}`} />
              <div className="flex-1 p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-inv-muted">{f.id}</span>
                    <ClassificationBadge classification={f.classification} />
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-inv-surface2 text-inv-text border border-inv-border">{f.status}</span>
                  </div>
                  <div className="w-48"><ConfidenceBar confidence={f.confidence} /></div>
                </div>
                
                <h3 className="text-lg font-medium text-inv-text mb-6">{f.description}</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3 border-r border-inv-border pr-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400">✓ Supporting Evidence</h4>
                    <div className="flex flex-wrap gap-2">
                      {f.evidenceRefs?.length > 0
                        ? f.evidenceRefs.map((eid: string) => <EvidenceChip key={eid} id={eid} />)
                        : <span className="text-xs text-inv-muted">None recorded</span>}
                    </div>
                    {f.supporting && (
                      <p className="text-xs text-inv-muted leading-relaxed">{f.supporting}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">⚠ Limitations &amp; Contradictions</h4>
                    <p className="text-sm text-amber-500/80 leading-relaxed">
                      {f.contradicting || 'No known limitations at this time.'}
                    </p>
                  </div>
                </div>

                <div className="bg-inv-surface2/50 rounded p-4 mb-6">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-3">Confidence Breakdown</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex gap-2"><span className="text-green-400">+</span> Multiple independent evidence sources corroborate</li>
                    <li className="flex gap-2"><span className="text-green-400">+</span> Temporal sequence is internally consistent</li>
                    <li className="flex gap-2"><span className="text-red-400">-</span> Some telemetry gaps reduce certainty</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-inv-border">
                  <button
                    onClick={() => updateStatus(f.id, 'accepted')}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-green-950/40 text-green-400 border border-green-800/60 hover:bg-green-900/60 transition-colors"
                  >Accept Finding</button>
                  <button
                    onClick={() => updateStatus(f.id, 'needs_investigation')}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-amber-950/40 text-amber-400 border border-amber-800/60 hover:bg-amber-900/60 transition-colors"
                  >Needs Investigation</button>
                  <button
                    onClick={() => updateStatus(f.id, 'rejected')}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-red-950/40 text-red-400 border border-red-800/60 hover:bg-red-900/60 transition-colors"
                  >Reject Finding</button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
