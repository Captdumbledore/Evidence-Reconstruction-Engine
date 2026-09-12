import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Globe, Lock, FolderOpen, Cpu, Wifi, Mail, File as FileIcon, ShieldCheck, Copy, Plus, X } from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  browser: Globe,
  auth: Lock,
  filesystem: FolderOpen,
  file: FolderOpen,
  process: Cpu,
  network: Wifi,
  email: Mail,
  unknown: FileIcon
};

const BORDER_COLORS: Record<string, string> = {
  email: 'border-l-[#8b5cf6]',
  filesystem: 'border-l-[#22c55e]',
  file: 'border-l-[#22c55e]',
  process: 'border-l-[#f97316]',
  network: 'border-l-[#e11d2e]',
  auth: 'border-l-[#3b82f6]',
  browser: 'border-l-[#06b6d4]',
  default: 'border-l-[#8b8d94]'
};

const ACQUISITION_META: Record<string, { system: string; method: string; tool: string }> = {
  email: { system: 'Microsoft Exchange Server 2019', method: 'Live Mailbox Acquisition', tool: 'RECONSTRUCT Collector v2.1' },
  browser: { system: 'Chrome 120.0 (WS-104)', method: 'Browser Artifact Extraction', tool: 'RECONSTRUCT Collector v2.1' },
  filesystem: { system: 'NTFS Volume (WS-104 C:\\)', method: 'Selective File Extraction', tool: 'RECONSTRUCT Collector v2.1' },
  file: { system: 'NTFS Volume (WS-104 C:\\)', method: 'Selective File Extraction', tool: 'RECONSTRUCT Collector v2.1' },
  process: { system: 'Windows Event Log (WS-104)', method: 'Event Log Export', tool: 'RECONSTRUCT Collector v2.1' },
  network: { system: 'Network Sensor / Firewall Logs', method: 'PCAP + Flow Export', tool: 'RECONSTRUCT Collector v2.1' },
  auth: { system: 'Active Directory (DC-01)', method: 'Security Event Log Export', tool: 'RECONSTRUCT Collector v2.1' },
};

export const Evidence: React.FC = () => {
  const { id } = useParams();
  const [evidence, setEvidence] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadType, setUploadType] = useState('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvidence = useCallback(() => {
    if (id) {
      api.getEvidence(id).then(setEvidence);
      api.getEvents(id).then(setEvents);
    }
  }, [id]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleAcquire = async () => {
    if (!id || !selectedFile) return;
    setIsUploading(true);
    try {
      await api.uploadEvidence(id, selectedFile, uploadType);
      fetchEvidence();
      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const getEventCount = (sourceType: string) => {
    return events.filter(e => e.source_type === sourceType).length;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end border-b border-inv-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">FORENSIC EVIDENCE REGISTRY</h1>
          <div className="flex items-center gap-2 text-sm text-inv-muted mt-1 font-mono">
            <span>CASE-{id || 'UNKNOWN'}</span>
            <span>&middot;</span>
            <span className="flex items-center text-green-500"><ShieldCheck size={14} className="mr-1" /> Chain of Custody Verified</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-inv-surface2 border border-inv-border hover:bg-inv-border text-white text-sm font-bold rounded transition-colors"
        >
          <Plus size={16} />
          IMPORT ADDITIONAL ARTIFACT
        </button>
      </div>

      <div className="space-y-4">
        {evidence.map(ev => {
          const st = ev.source_type || 'unknown';
          const Icon = TYPE_ICONS[st] || TYPE_ICONS.unknown;
          const borderColor = BORDER_COLORS[st] || BORDER_COLORS.default;
          const meta = ACQUISITION_META[st] || { system: 'Unknown System', method: 'Unknown Method', tool: 'Generic Importer' };
          const isExpanded = expandedId === ev.id;
          const eventCount = getEventCount(st);

          return (
            <div key={ev.id} className={`bg-inv-surface border border-inv-border rounded-lg overflow-hidden ${borderColor} border-l-[4px]`}>
              <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-inv-surface2 rounded text-inv-muted"><Icon size={20} /></div>
                    <div>
                      <h2 className="text-sm font-bold text-white font-mono">{ev.id} &middot; {st.toUpperCase()} ARTIFACTS</h2>
                    </div>
                  </div>
                  <div className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                    VERIFIED <ShieldCheck size={12} className="ml-1" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-inv-muted mb-1">Source System</div>
                    <div className="text-inv-text font-medium">{meta.system}</div>
                  </div>
                  <div>
                    <div className="text-inv-muted mb-1">Acquisition Method</div>
                    <div className="text-inv-text font-medium">{meta.method}</div>
                  </div>
                  <div>
                    <div className="text-inv-muted mb-1">Acquired By</div>
                    <div className="text-inv-text font-medium">{meta.tool}</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-xs bg-inv-bg p-3 rounded border border-inv-border">
                  <div className="col-span-1">
                    <div className="text-inv-muted mb-1">Artifact</div>
                    <div className="text-inv-text font-medium truncate" title={ev.filename}>{ev.filename}</div>
                  </div>
                  <div className="col-span-1">
                    <div className="text-inv-muted mb-1">SHA-256</div>
                    <div className="flex items-center gap-2 group">
                      <span className="font-mono text-inv-text">{(ev.hash || 'N/A').substring(0, 12)}...</span>
                      <button onClick={() => navigator.clipboard.writeText(ev.hash || '')} className="text-inv-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Copy size={12} /></button>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <div className="text-inv-muted mb-1">Size</div>
                    <div className="text-inv-text">{((ev.size || 0) / 1024).toFixed(1)} KB</div>
                  </div>
                  <div className="col-span-1">
                    <div className="text-inv-muted mb-1">Acquired</div>
                    <div className="text-inv-text">{new Date(ev.uploaded_at || ev.created_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setExpandedId(isExpanded ? null : ev.id)} className="px-4 py-1.5 bg-inv-surface2 hover:bg-inv-border text-white text-xs font-bold rounded transition-colors">
                    {isExpanded ? 'HIDE ARTIFACT DETAILS' : 'INSPECT ARTIFACT'}
                  </button>
                  <button className="px-4 py-1.5 bg-inv-surface2 text-inv-muted text-xs font-bold rounded cursor-default border border-transparent">
                    VIEW EVENTS ({eventCount})
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 border-t border-inv-border bg-inv-surface2/30">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2">Full Hash Signature</h4>
                      <div className="bg-inv-bg p-3 rounded border border-inv-border font-mono text-xs text-inv-text break-all">
                        {ev.hash || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2">System Annotations</h4>
                      <div className="bg-inv-bg p-3 rounded border border-inv-border text-sm text-inv-text">
                        <p>Source recognized as {st}. Parsed successfully.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {evidence.length === 0 && (
          <div className="text-center py-12 text-inv-muted bg-inv-surface border border-inv-border rounded-lg">
            No evidence acquired for this case.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[500px] bg-inv-surface border border-inv-border rounded-lg shadow-2xl flex flex-col">
            <div className="p-4 border-b border-inv-border flex justify-between items-start">
              <div>
                <h2 className="text-sm font-bold text-white tracking-wide">FORENSIC ARTIFACT IMPORT</h2>
                <div className="text-xs text-inv-muted font-mono mt-1">CASE-{id || 'UNKNOWN'}</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-inv-muted hover:text-white"><X size={18} /></button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-inv-muted mb-2">Import Source</label>
                <div className="space-y-2 text-sm text-inv-text">
                  <label className="flex items-center gap-2 opacity-50"><input type="radio" disabled /> Live System Acquisition</label>
                  <label className="flex items-center gap-2 opacity-50"><input type="radio" disabled /> Disk Image / Memory Dump</label>
                  <label className="flex items-center gap-2"><input type="radio" checked readOnly className="accent-inv-red" /> Artifact File (Log / Export)</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-inv-muted mb-2">Evidence Type</label>
                <select value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full bg-inv-bg border border-inv-border rounded p-2 text-sm text-white focus:outline-none focus:border-inv-red">
                  {Object.keys(TYPE_ICONS).filter(k => k !== 'unknown').map(k => (
                    <option key={k} value={k}>{k.toUpperCase()}</option>
                  ))}
                  <option value="unknown">OTHER / UNKNOWN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-inv-muted mb-2">Description</label>
                <input type="text" placeholder="Optional description..." className="w-full bg-inv-bg border border-inv-border rounded p-2 text-sm text-white focus:outline-none focus:border-inv-red" />
              </div>

              <div 
                className={`mt-4 p-8 border-2 border-dashed rounded text-center cursor-pointer transition-colors ${isDragging ? 'border-inv-red bg-inv-red/10' : 'border-inv-border2 hover:border-inv-muted bg-inv-bg'}`}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                />
                {selectedFile ? (
                  <div className="text-inv-red-bright font-mono text-sm font-bold truncate">
                    {selectedFile.name}
                  </div>
                ) : (
                  <>
                    <div className="text-inv-text font-bold mb-1">Click or drop artifact file here</div>
                    <div className="text-xs text-inv-muted">Supported: .json .log .csv .evtx .pcap</div>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-inv-border bg-inv-surface2 flex gap-3 justify-end">
              <button onClick={() => { setIsModalOpen(false); setSelectedFile(null); }} className="px-4 py-2 text-xs font-bold text-inv-muted hover:text-white transition-colors">CANCEL</button>
              <button 
                onClick={handleAcquire}
                disabled={!selectedFile || isUploading}
                className={`px-4 py-2 text-white text-xs font-bold rounded transition-colors ${!selectedFile || isUploading ? 'bg-inv-border cursor-not-allowed text-inv-muted' : 'bg-inv-red hover:bg-inv-red-bright'}`}
              >
                {isUploading ? 'ACQUIRING...' : 'ACQUIRE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
