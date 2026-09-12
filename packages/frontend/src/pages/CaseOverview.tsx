import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ClassificationBadge } from '../components/ClassificationBadge';
import { EvidenceChip } from '../components/EvidenceChip';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Activity, Shield, Network, AlertCircle } from 'lucide-react';

export const CaseOverview: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getCase(id),
        api.getEvents(id),
        api.getFindings(id),
        api.getAuditLog(id)
      ]).then(([c, evts, fndgs, audit]) => {
        setData({ case: c, events: evts, findings: fndgs.slice(0, 3), audit: audit.slice(0, 10) });
      });
    }
  }, [id]);

  if (!data) return <div className="p-8">Loading...</div>;

  const events = data.events;
  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2,'0')}:00`,
    count: events.filter((e: any) => new Date(e.timestamp).getHours() === h).length
  })).filter(d => d.count > 0 || (d.hour >= '09:00' && d.hour <= '10:00'));

  const recentEvents = events.slice(-10);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-inv-muted uppercase tracking-wider font-semibold">Events</div>
            <Activity size={18} className="text-blue-500" />
          </div>
          <div className="text-3xl font-mono text-inv-text">{data.case.stats.events}</div>
        </div>
        <div className="stat-card border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-inv-muted uppercase tracking-wider font-semibold">Evidence</div>
            <Shield size={18} className="text-green-500" />
          </div>
          <div className="text-3xl font-mono text-inv-text">{data.case.stats.evidence}</div>
        </div>
        <div className="stat-card border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-inv-muted uppercase tracking-wider font-semibold">Entities</div>
            <Network size={18} className="text-purple-500" />
          </div>
          <div className="text-3xl font-mono text-inv-text">{data.case.stats.entities}</div>
        </div>
        <div className="stat-card border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-inv-muted uppercase tracking-wider font-semibold">Findings</div>
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div className="text-3xl font-mono text-inv-text">{data.case.stats.findings}</div>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-inv-muted">Event Frequency</h2>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
              <XAxis dataKey="hour" stroke="#7d8590" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#7d8590" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px' }}
                itemStyle={{ color: '#e6edf3' }}
              />
              <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#eventGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-semibold">Investigation Narrative</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <ClassificationBadge classification="INFERENCE" />
                <div className="w-48"><ConfidenceBar confidence={0.91} /></div>
              </div>
              <p className="text-sm leading-relaxed text-inv-text mb-6">
                {data.case.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-inv-muted uppercase tracking-wider mt-1 mr-2">Key Evidence:</span>
                {['EV-001', 'EV-003', 'EV-004', 'EV-005', 'EV-006'].map(ev => <EvidenceChip key={ev} id={ev} />)}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-semibold">Critical Findings</h2>
              <Link to={`/cases/${id}/findings`} className="text-blue-400 text-xs hover:underline">View all</Link>
            </div>
            <div className="p-5 space-y-3">
              {data.findings.map((f: any) => (
                <div key={f.id} className="bg-inv-bg border border-inv-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-inv-muted">{f.id}</span>
                      <ClassificationBadge classification={f.classification} />
                    </div>
                    <div className="w-24"><ConfidenceBar confidence={f.confidence} showLabel={true} /></div>
                  </div>
                  <p className="text-sm">{f.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-semibold">Recent Events</h2>
            </div>
            <div className="p-5 max-h-[400px] overflow-y-auto">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:w-0.5 before:bg-inv-border">
                {recentEvents.map((e: any) => (
                  <div key={e.id} className="relative pl-6">
                    <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-inv-bg" />
                    <div className="text-xs text-inv-muted mb-0.5">{new Date(e.timestamp).toLocaleTimeString()} - {e.event_type}</div>
                    <div className="text-sm truncate text-inv-text">{e.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-semibold">Audit Log</h2>
            </div>
            <div className="p-5 max-h-[300px] overflow-y-auto space-y-3">
              {data.audit.map((a: any) => (
                <div key={a.id} className="text-xs">
                  <div className="text-inv-muted mb-0.5">{new Date(a.timestamp).toLocaleString()}</div>
                  <div className="text-inv-text">{a.action} on <span className="font-mono text-inv-muted">{a.target}</span></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
