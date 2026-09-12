import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Download, Printer, Code, FileJson, AlertOctagon } from 'lucide-react';

export const Reports: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        api.getCase(id),
        api.getFindings(id),
        api.getEvidence(id)
      ]).then(([c, f, e]) => setData({ case: c, findings: f, evidence: e }));
    }
  }, [id]);

  const exportJSON = () => {
    if (!data) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const el = document.createElement('a');
    el.setAttribute("href", dataStr);
    el.setAttribute("download", `report_${data.case.id}.json`);
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  const exportCSV = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "=== CASE DETAILS ===\n";
    csvContent += `ID,${data.case.id}\n`;
    csvContent += `Investigator,${data.case.investigator}\n`;
    csvContent += `Generated,${new Date().toLocaleDateString()}\n`;
    csvContent += `Description,"${data.case.description}"\n\n`;

    csvContent += "=== FINDINGS ===\n";
    csvContent += "ID,Type,Confidence,Description\n";
    data.findings.forEach((f: any) => {
      csvContent += `${f.id},${f.classification},${(f.confidence * 100).toFixed(0)}%,"${f.description.replace(/"/g, '""')}"\n`;
    });
    csvContent += "\n";

    csvContent += "=== EVIDENCE ===\n";
    csvContent += "ID,Filename,Type,Hash\n";
    data.evidence.forEach((ev: any) => {
      csvContent += `${ev.id},${ev.filename},${ev.source_type},${ev.hash}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const el = document.createElement('a');
    el.setAttribute("href", encodedUri);
    el.setAttribute("download", `report_${data.case.id}.csv`);
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  const exportHTML = () => {
    if (!data) return;
    const htmlContent = document.getElementById('report-content')?.outerHTML || '';
    const fullHtml = `<!DOCTYPE html><html><head><title>Report ${data.case.id}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8">${htmlContent}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const el = document.createElement('a');
    el.href = URL.createObjectURL(blob);
    el.download = `report_${data.case.id}.html`;
    document.body.appendChild(el);
    el.click();
    el.remove();
  };

  if (!data) return <div className="p-8">Generating report...</div>;

  return (
    <div className="flex h-full bg-inv-bg print:h-auto print:block">
      {/* Sidebar */}
      <div className="w-64 bg-inv-surface border-r border-inv-border p-4 flex flex-col gap-2 shrink-0 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-inv-muted mb-2">Export Options</h2>
        <button onClick={exportHTML} className="flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-inv-surface2 text-inv-text transition-colors">
          <Code size={16} className="text-blue-400" /> Export as HTML
        </button>
        <button onClick={exportJSON} className="flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-inv-surface2 text-inv-text transition-colors">
          <FileJson size={16} className="text-green-400" /> Export as JSON
        </button>
        <button onClick={exportCSV} className="flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-inv-surface2 text-inv-text transition-colors">
          <Download size={16} className="text-purple-400" /> Export as CSV
        </button>
        <div className="my-2 border-t border-inv-border" />
        <button onClick={() => window.print()} className="flex items-center gap-3 px-3 py-2 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors justify-center font-medium">
          <Printer size={16} /> Print Report
        </button>
      </div>

      {/* Print Preview Canvas */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#0a0d12] print:p-0 print:overflow-visible print:block print:bg-white">
        <div id="report-content" className="bg-white text-black w-full max-w-[816px] min-h-[1056px] p-12 shadow-2xl print:shadow-none print:min-h-0 print:p-0">
          
          <div className="flex items-start justify-between border-b-2 border-gray-900 pb-6 mb-8">
            <div className="flex items-center gap-3">
              <AlertOctagon size={32} className="text-red-600" />
              <div>
                <h1 className="text-2xl font-bold font-serif uppercase tracking-widest">Reconstruct</h1>
                <p className="text-xs font-mono text-gray-500">Digital Forensics Report</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-mono text-gray-600">Case ID: <span className="font-bold text-black">{data.case.id}</span></div>
              <div className="text-gray-600">Generated: {new Date().toLocaleDateString()}</div>
              <div className="text-gray-600">Investigator: {data.case.investigator}</div>
            </div>
          </div>

          <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-4 uppercase tracking-wider text-gray-800">Executive Summary</h2>
          <div className="flex gap-6 mb-8">
            <div className="w-1/3 bg-gray-100 p-4 border-l-4 border-red-600">
              <div className="text-xs font-bold text-gray-500 uppercase">Overall Risk Level</div>
              <div className="text-2xl font-black text-red-600 uppercase">Critical</div>
            </div>
            <div className="w-2/3 text-sm leading-relaxed text-gray-700">
              {data.case.description}
            </div>
          </div>

          <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-4 uppercase tracking-wider text-gray-800 mt-12">Key Findings</h2>
          <div className="space-y-4 mb-12">
            {data.findings.filter((f: any) => f.confidence > 0.8).map((f: any) => (
              <div key={f.id} className="border border-gray-300 p-4 text-sm flex gap-4">
                <div className="w-20 shrink-0 font-mono text-xs text-gray-500 border-r border-gray-300">{f.id}</div>
                <div>
                  <div className="font-bold mb-1">{f.description}</div>
                  <div className="text-xs text-gray-600">Confidence: {(f.confidence * 100).toFixed(0)}% | Type: {f.classification}</div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-bold border-b border-gray-300 pb-1 mb-4 uppercase tracking-wider text-gray-800 mt-12">Evidence Inventory</h2>
          <table className="w-full text-sm text-left border-collapse mb-12">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 border border-gray-300">ID</th>
                <th className="p-2 border border-gray-300">Filename</th>
                <th className="p-2 border border-gray-300">Type</th>
                <th className="p-2 border border-gray-300">SHA-256 (Truncated)</th>
              </tr>
            </thead>
            <tbody>
              {data.evidence.map((ev: any, i: number) => (
                <tr key={ev.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="p-2 border border-gray-300 font-mono text-xs">{ev.id}</td>
                  <td className="p-2 border border-gray-300">{ev.filename}</td>
                  <td className="p-2 border border-gray-300">{ev.source_type}</td>
                  <td className="p-2 border border-gray-300 font-mono text-xs">{(ev.hash || '').substring(0, 16)}...</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};
