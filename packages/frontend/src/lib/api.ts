const API_BASE = 'http://localhost:3001';

export const api = {
  getCases: () => fetch(`${API_BASE}/api/cases`).then(r => r.json()),
  getCase: (id: string) => fetch(`${API_BASE}/api/cases/${id}`).then(r => r.json()),
  createCase: (data: any) => fetch(`${API_BASE}/api/cases`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) }).then(r => r.json()),
  getEvents: (caseId: string, filters?: any) => {
    let q = new URLSearchParams(filters || {}).toString();
    return fetch(`${API_BASE}/api/cases/${caseId}/events?${q}`).then(r => r.json());
  },
  getTimeline: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/timeline`).then(r => r.json()),
  getGraph: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/graph`).then(r => r.json()),
  getFindings: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/findings`).then(r => r.json()),
  getQuestions: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/questions`).then(r => r.json()),
  addQuestion: (caseId: string, data: { text: string; answer?: string; confidence?: number; evidenceRefs?: string[]; missingEvidence?: string }) => fetch(`${API_BASE}/api/cases/${caseId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(async response => {
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to add question');
    return result;
  }),
  getEvidence: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/evidence`).then(r => r.json()),
  uploadEvidence: (caseId: string, file: File, sourceType: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sourceType', sourceType);
    return fetch(`${API_BASE}/api/cases/${caseId}/evidence`, { method: 'POST', body: fd }).then(r => r.json());
  },
  analyzeCase: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/analyze`, { method: 'POST' }).then(r => r.json()),
  getReport: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/report`).then(r => r.json()),
  updateFinding: (findingId: string, status: string) => fetch(`${API_BASE}/api/findings/${findingId}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status}) }).then(r => r.json()),
  addAnnotation: (caseId: string, annotation: any) => fetch(`${API_BASE}/api/cases/${caseId}/annotations`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(annotation) }).then(r => r.json()),
  getAuditLog: (caseId: string) => fetch(`${API_BASE}/api/cases/${caseId}/audit`).then(r => r.json()),
};
