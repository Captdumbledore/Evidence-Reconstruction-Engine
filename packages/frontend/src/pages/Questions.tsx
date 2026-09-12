import React, { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { ChevronDown, ChevronRight, AlertTriangle, Plus, X } from 'lucide-react';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { EvidenceChip } from '../components/EvidenceChip';

export const Questions: React.FC = () => {
  const { id } = useParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState('0');
  const [evidenceRefs, setEvidenceRefs] = useState('');
  const [missingEvidence, setMissingEvidence] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) api.getQuestions(id).then(setQuestions);
  }, [id]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!id || !questionText.trim()) {
      setFormError('Enter a question before saving.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      const createdQuestion = await api.addQuestion(id, {
        text: questionText.trim(),
        answer: answer.trim(),
        confidence: Number(confidence) / 100,
        evidenceRefs: evidenceRefs.split(',').map(ref => ref.trim()).filter(Boolean),
        missingEvidence: missingEvidence.trim()
      });
      setQuestions(currentQuestions => [...currentQuestions, createdQuestion]);
      setQuestionText('');
      setAnswer('');
      setConfidence('0');
      setEvidenceRefs('');
      setMissingEvidence('');
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to add question.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6 border-b border-inv-border pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Investigative Questions</h1>
          <p className="text-sm text-inv-muted mt-1">Evidence-grounded answers with confidence assessment</p>
        </div>
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors"
          onClick={() => { setShowForm(current => !current); setFormError(''); }}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add question'}
        </button>
      </div>

      {showForm && (
        <form className="panel p-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2" htmlFor="question-text">Question</label>
            <textarea id="question-text" value={questionText} onChange={event => setQuestionText(event.target.value)} rows={2} className="w-full bg-inv-bg border border-inv-border rounded p-3 text-sm text-inv-text resize-y" placeholder="What do you want to investigate?" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2" htmlFor="question-answer">Answer</label>
            <textarea id="question-answer" value={answer} onChange={event => setAnswer(event.target.value)} rows={3} className="w-full bg-inv-bg border border-inv-border rounded p-3 text-sm text-inv-text resize-y" placeholder="Add an answer if one is already known" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2" htmlFor="question-confidence">Confidence: {confidence}%</label>
              <input id="question-confidence" type="range" min="0" max="100" value={confidence} onChange={event => setConfidence(event.target.value)} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2" htmlFor="question-evidence">Evidence IDs</label>
              <input id="question-evidence" value={evidenceRefs} onChange={event => setEvidenceRefs(event.target.value)} className="w-full bg-inv-bg border border-inv-border rounded p-3 text-sm text-inv-text" placeholder="EV-001, EV-002" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2" htmlFor="question-missing-evidence">Missing evidence</label>
            <input id="question-missing-evidence" value={missingEvidence} onChange={event => setMissingEvidence(event.target.value)} className="w-full bg-inv-bg border border-inv-border rounded p-3 text-sm text-inv-text" placeholder="What would make the answer conclusive?" />
          </div>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
          <button type="submit" disabled={isSaving} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-medium text-white">
            {isSaving ? 'Saving...' : 'Save question'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const isExpanded = expandedId === q.id;
          return (
            <div key={q.id} className="panel overflow-hidden">
              <div
                className="p-5 cursor-pointer flex gap-4 items-start hover:bg-inv-surface2/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                <div className="mt-1">
                  {isExpanded
                    ? <ChevronDown size={18} className="text-inv-muted" />
                    : <ChevronRight size={18} className="text-inv-muted" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-semibold bg-inv-surface2 px-1.5 py-0.5 rounded text-inv-muted">
                      Q{idx + 1}
                    </span>
                  </div>
                  <h3 className={`text-base font-medium leading-snug ${isExpanded ? 'text-blue-400' : 'text-inv-text'}`}>
                    {q.text}
                  </h3>
                </div>
                <div className="shrink-0 w-32 mt-1">
                  <ConfidenceBar confidence={q.confidence} />
                </div>
              </div>

              <div
                className="overflow-hidden border-t border-inv-border bg-inv-bg/50"
                style={{
                  maxHeight: isExpanded ? '800px' : '0px',
                  opacity: isExpanded ? 1 : 0,
                  transition: 'max-height 0.3s ease, opacity 0.2s ease'
                }}
              >
                <div className="p-6 ml-8 space-y-5">
                  {q.confidence < 0.80 && (
                    <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded flex gap-3 items-start">
                      <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-500/90 leading-relaxed">
                        Confidence below 80%. This answer requires human verification and additional evidence to become conclusive.
                      </p>
                    </div>
                  )}

                  <div className="text-sm text-inv-text leading-relaxed whitespace-pre-wrap">
                    {q.answer || 'No answer determined yet.'}
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-inv-border/50">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-3">
                        Supporting Evidence
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {q.evidenceRefs?.length > 0
                          ? q.evidenceRefs.map((eid: string) => <EvidenceChip key={eid} id={eid} />)
                          : <span className="text-xs text-inv-muted">None available</span>}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-3">
                        Missing Evidence
                      </h4>
                      {q.missing_evidence ? (
                        <div className="flex items-start gap-2 text-xs text-amber-500/80">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{q.missing_evidence}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-inv-muted">No gaps identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
