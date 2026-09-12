import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  AlertOctagon, Plus, FolderOpen, Clock, Shield, Activity,
  ChevronRight, Zap, Search, Eye
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'text-inv-red bg-[#e11d2e]/10 border-[#e11d2e]/30',
  closed: 'text-gray-400 bg-gray-900 border-gray-700',
  archived: 'text-gray-500 bg-[#0D0E11] border-[#25262C]',
};

export const Landing: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', investigator: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { api.getCases().then(setCases); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const c = await api.createCase(form);
    setCreating(false);
    navigate(`/cases/${c.id}/board`);
  };

  return (
    <div className="min-h-screen bg-inv-bg bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] text-white">
      {/* Hero section */}
      <div className="border-b border-inv-border bg-inv-surface/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-lg bg-inv-red/10 border border-inv-red/30 flex items-center justify-center shadow-[0_0_20px_rgba(225,29,46,0.2)]">
                  <AlertOctagon size={28} className="text-inv-red" />
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tighter text-white">RECONSTRUCT</h1>
                  <p className="text-gray-400 text-sm tracking-widest uppercase mt-1">Digital Evidence Reconstruction Platform</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm max-w-xl leading-relaxed mt-6">
                Transform fragmented digital artifacts into coherent, investigator-verifiable
                reconstructions of events — with full evidence traceability and uncertainty quantification.
              </p>
              {/* Feature pills */}
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  { icon: Zap, label: 'Correlation Engine' },
                  { icon: Activity, label: 'Interactive Timeline' },
                  { icon: Search, label: 'Evidence Graph' },
                  { icon: Eye, label: 'Hypothesis Tracking' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-inv-surface2 border border-inv-border text-xs font-semibold text-gray-400 uppercase shadow-sm">
                    <Icon size={12} className="text-gray-500" />{label}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-3 gap-8">
          {/* Cases list */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen size={14} />
                Cases ({cases.length})
              </h2>
            </div>

            <div className="space-y-4">
              {cases.map(c => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/cases/${c.id}/board`)}
                  className="group block bg-[#0D0E11] border border-[#25262C] rounded-lg cursor-pointer transition-all duration-300 hover:border-inv-red hover:shadow-[0_0_15px_rgba(225,29,46,0.15)] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-mono font-medium text-gray-300">{c.id}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${STATUS_COLORS[c.status] ?? STATUS_COLORS.closed}`}>
                            {c.status === 'active' ? '● ' : ''}{c.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">{c.name}</h3>
                      </div>
                      <ChevronRight size={18} className="text-gray-600 group-hover:text-inv-red transition-colors mt-1 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-500">
                      <span className="flex items-center gap-2">
                        <Shield size={13} className="text-gray-600" /> Inv: {c.investigator}
                      </span>
                      <span className="flex items-center gap-2 font-mono">
                        <Clock size={13} className="text-gray-600" /> {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {c.description && (
                      <p className="mt-4 text-sm text-gray-400 line-clamp-2 leading-relaxed">{c.description}</p>
                    )}
                  </div>
                </div>
              ))}

              {cases.length === 0 && (
                <div className="bg-[#0D0E11] border border-[#25262C] rounded-lg p-12 text-center">
                  <FolderOpen size={32} className="text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm font-medium">No cases yet. Create your first case.</p>
                </div>
              )}
            </div>
          </div>

          {/* Create form */}
          <div>
            {showForm && (
              <div className="bg-inv-surface border border-inv-border rounded-lg animate-slide-in shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-inv-border bg-inv-surface2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                    <Plus size={14} className="text-inv-red" /> New Investigation Case
                  </h3>
                </div>
                <form onSubmit={handleCreate} className="p-5 space-y-5">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-widest">Case Name</label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      className="w-full bg-inv-bg border border-inv-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-inv-red transition-colors placeholder-gray-700"
                      placeholder="e.g. Unauthorized Access — WS-104"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-widest">Investigator</label>
                    <input
                      value={form.investigator}
                      onChange={e => setForm(f => ({ ...f, investigator: e.target.value }))}
                      required
                      className="w-full bg-inv-bg border border-inv-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-inv-red transition-colors placeholder-gray-700"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-widest">Description</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      required
                      rows={4}
                      className="w-full bg-inv-bg border border-inv-border rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-inv-red transition-colors resize-none placeholder-gray-700"
                      placeholder="Brief case description..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-inv-red hover:bg-[#c91828] text-white text-sm font-bold uppercase tracking-wide rounded transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(225,29,46,0.2)]"
                  >
                    {creating ? 'Creating...' : <><Plus size={16} /> Create Case</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="w-full mt-2 px-4 py-2 bg-transparent text-gray-500 hover:text-white text-xs font-medium uppercase tracking-wide transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            )}

            {!showForm && (
              <div 
                className="bg-[#0D0E11]/50 border border-dashed border-[#25262C] hover:border-inv-red/50 hover:bg-inv-red/5 hover:shadow-[0_0_15px_rgba(225,29,46,0.1)] rounded-lg p-8 cursor-pointer transition-all duration-300 group flex flex-col items-center justify-center text-center" 
                onClick={() => setShowForm(true)}
              >
                <Plus size={28} className="text-gray-600 group-hover:text-inv-red transition-colors mb-3" />
                <span className="text-sm font-medium text-gray-500 group-hover:text-gray-300 transition-colors">Create new investigation case</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

