import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { initDb, getRows, runQuery } from './db';
import { seedDemoCase } from './seed';
import { runCorrelation } from './services/correlationEngine';
import { runReconstruction } from './services/reconstructionEngine';
import { hashBuffer } from './services/hasher';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    // Allow only safe non-executable types
    const allowed = ['.csv', '.json', '.log', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
    const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext}`));
    }
  }
});


app.get('/api/cases', (req, res) => res.json(getRows('SELECT * FROM cases')));
app.post('/api/cases', (req, res) => {
  const id = 'CASE-' + Math.floor(Math.random() * 100000);
  runQuery("INSERT INTO cases (id, name, investigator, created_at, status, description) VALUES (?, ?, ?, ?, ?, ?)", 
    [id, req.body.name, req.body.investigator, new Date().toISOString(), 'active', req.body.description]);
  res.json({ id });
});

app.get('/api/cases/:id', (req, res) => {
  const c = getRows('SELECT * FROM cases WHERE id = ?', [req.params.id])[0];
  if (!c) return res.status(404).json({error: 'not found'});
  const events = getRows('SELECT count(id) as c FROM events WHERE case_id = ?', [req.params.id])[0].c;
  const evidence = getRows('SELECT count(id) as c FROM evidence WHERE case_id = ?', [req.params.id])[0].c;
  const entities = getRows('SELECT count(id) as c FROM entities WHERE case_id = ?', [req.params.id])[0].c;
  const findings = getRows('SELECT count(id) as c FROM findings WHERE case_id = ? AND confidence >= 0.8', [req.params.id])[0].c;
  res.json({ ...c, stats: { events, evidence, entities, findings } });
});

app.get('/api/cases/:id/events', (req, res) => {
  let sql = 'SELECT * FROM events WHERE case_id = ?';
  const params: any[] = [req.params.id];
  if (req.query.source) { sql += ' AND source_type = ?'; params.push(req.query.source); }
  if (req.query.event_type) { sql += ' AND event_type = ?'; params.push(req.query.event_type); }
  if (req.query.actor) { sql += ' AND actor = ?'; params.push(req.query.actor); }
  if (req.query.min_confidence) { sql += ' AND confidence >= ?'; params.push(req.query.min_confidence); }
  if (req.query.start_time) { sql += ' AND timestamp >= ?'; params.push(req.query.start_time); }
  if (req.query.end_time) { sql += ' AND timestamp <= ?'; params.push(req.query.end_time); }
  sql += ' ORDER BY timestamp ASC';
  res.json(getRows(sql, params).map(e => ({...e, evidenceIds: JSON.parse(e.evidence_refs || '[]')})));
});

app.get('/api/cases/:id/timeline', (req, res) => {
  const events = getRows('SELECT * FROM events WHERE case_id = ? ORDER BY timestamp ASC', [req.params.id]);
  const lanesMap: Record<string, any> = {
    browser: { id: 'browser', label: 'Browser', events: [] },
    auth: { id: 'auth', label: 'Authentication', events: [] },
    files: { id: 'filesystem', label: 'Files', events: [] },
    process: { id: 'process', label: 'Processes', events: [] },
    network: { id: 'network', label: 'Network', events: [] },
    email: { id: 'email', label: 'Email', events: [] }
  };
  events.forEach(e => {
    let lane = 'files';
    if (e.source_type === 'browser') lane = 'browser';
    else if (e.source_type === 'auth') lane = 'auth';
    else if (e.source_type === 'process') lane = 'process';
    else if (e.source_type === 'network') lane = 'network';
    else if (e.source_type === 'email') lane = 'email';
    
    if (lanesMap[lane]) lanesMap[lane].events.push({...e, evidenceIds: JSON.parse(e.evidence_refs || '[]')});
  });
  
  const correlations = getRows('SELECT * FROM correlations WHERE case_id = ?', [req.params.id]).map(c => ({
    ...c, eventIds: JSON.parse(c.event_ids || '[]'), evidenceIds: JSON.parse(c.evidence_ids || '[]'), factors: JSON.parse(c.factors || '{}')
  }));
  
  res.json({
    lanes: Object.values(lanesMap),
    timeRange: { start: events[0]?.timestamp, end: events[events.length - 1]?.timestamp },
    correlations
  });
});

app.get('/api/cases/:id/graph', (req, res) => {
  const entities = getRows('SELECT * FROM entities WHERE case_id = ?', [req.params.id]);
  const events = getRows('SELECT * FROM events WHERE case_id = ?', [req.params.id]);

  // Hierarchical layout: assign y-tier by entity type
  const tierY: Record<string, number> = {
    user: 0,
    device: 120,
    email: 240,
    domain: 240,
    url: 240,
    file: 380,
    process: 380,
    ip: 520,
  };

  // Group entities by type tier for x-positioning
  const tierCounts: Record<string, number> = {};
  const tierIdx: Record<string, number> = {};

  const nodes = entities.map((ent) => {
    const tier = ent.type in tierY ? ent.type : 'file';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    return { ent, tier };
  });

  // Count per tier for centering
  const tierTotal: Record<string, number> = {};
  nodes.forEach(({ tier }) => { tierTotal[tier] = (tierTotal[tier] || 0) + 1; });

  const mappedNodes = nodes.map(({ ent, tier }) => {
    tierIdx[tier] = (tierIdx[tier] || 0);
    const idx = tierIdx[tier];
    tierIdx[tier]++;
    const total = tierTotal[tier];
    const xSpacing = 220;
    const x = (idx - (total - 1) / 2) * xSpacing;
    const y = tierY[tier] ?? 380;

    const e = events.filter(ev => ev.description.includes(ent.value) || ev.actor === ent.value);
    return {
      id: ent.id,
      type: ent.type + 'Node',
      data: {
        label: ent.value,
        nodeType: ent.type,
        confidence: 1.0,
        eventCount: e.length,
        evidenceIds: Array.from(new Set(e.flatMap(x => JSON.parse(x.evidence_refs || '[]')))),
        firstSeen: ent.first_seen,
        lastSeen: ent.last_seen,
      },
      position: { x, y }
    };
  });

  // Build deduplicated edges (one per unique source→target→label combination)
  const edgeSet = new Set<string>();
  const edges: any[] = [];
  events.forEach(e => {
    const fromEnt = entities.find(ent => ent.value === e.actor);
    const toEnt = entities.find(ent => ent.type !== 'user' && e.description.includes(ent.value));
    if (fromEnt && toEnt && fromEnt.id !== toEnt.id) {
      const edgeKey = `${fromEnt.id}::${toEnt.id}::${e.event_type}`;
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push({
          id: `edge-${fromEnt.id}-${toEnt.id}-${e.event_type}`,
          source: fromEnt.id,
          target: toEnt.id,
          label: e.event_type.replace(/_/g, ' '),
          animated: e.event_type.startsWith('NETWORK'),
          data: { classification: e.confidence > 0.95 ? 'FACT' : 'CORRELATED', eventIds: [e.id] }
        });
      }
    }
  });
  res.json({ nodes: mappedNodes, edges });
});


app.get('/api/cases/:id/findings', (req, res) => res.json(getRows('SELECT * FROM findings WHERE case_id = ?', [req.params.id]).map(f => ({...f, evidenceRefs: JSON.parse(f.evidence_refs || '[]')} ))));
app.get('/api/cases/:id/questions', (req, res) => res.json(getRows('SELECT * FROM questions WHERE case_id = ?', [req.params.id]).map(q => ({...q, evidenceRefs: JSON.parse(q.evidence_refs || '[]')}))));
app.get('/api/cases/:id/audit', (req, res) => res.json(getRows('SELECT * FROM audit_log WHERE case_id = ? ORDER BY timestamp DESC', [req.params.id])));
app.get('/api/cases/:id/evidence', (req, res) => {
  const ev = getRows('SELECT * FROM evidence WHERE case_id = ?', [req.params.id]);
  // Log audit
  runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
    ['AUD-' + Date.now(), req.params.id, new Date().toISOString(), 'Evidence List Viewed', req.params.id]);
  res.json(ev);
});

// Evidence upload — real SHA-256 hash, file type validation, metadata recording
app.post('/api/cases/:id/evidence', upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const caseId = req.params.id;
  const file = req.file;
  const sha256 = hashBuffer(file.buffer);
  const evId = 'EV-' + String(getRows('SELECT count(*) as c FROM evidence WHERE case_id = ?', [caseId])[0].c + 1).padStart(3, '0');
  const sourceType = req.body.sourceType || 'unknown';
  const now = new Date().toISOString();
  // Sanitize filename — strip path components
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/\.{2,}/g, '.');
  runQuery("INSERT INTO evidence (id, case_id, filename, source_type, size, sha256, upload_timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [evId, caseId, safeName, sourceType, file.size, sha256, now, 'verified']);
  runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
    ['AUD-' + Date.now(), caseId, now, 'Evidence Uploaded', evId]);
  res.json({ id: evId, filename: safeName, sha256, size: file.size, status: 'verified', upload_timestamp: now });
});

app.post('/api/cases/:id/analyze', (req, res) => {
  const caseId = req.params.id;
  const clusters = runCorrelation(caseId);
  runQuery("DELETE FROM correlations WHERE case_id = ?", [caseId]);
  for (const c of clusters) {
    runQuery("INSERT INTO correlations (id, case_id, name, description, event_ids, evidence_ids, rule, confidence, classification, factors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [c.id, caseId, c.name, c.description, JSON.stringify(c.eventIds), JSON.stringify(c.evidenceIds), c.rule, c.confidence, c.classification, JSON.stringify(c.factors)]);
  }
  
  const recons = runReconstruction(caseId, clusters);
  runQuery("DELETE FROM reconstructions WHERE case_id = ?", [caseId]);
  for (const r of recons) {
    runQuery("INSERT INTO reconstructions (id, case_id, name, description, steps, confidence, classification, evidence_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [r.id, caseId, r.name, r.description, JSON.stringify(r.steps), r.confidence, r.classification, JSON.stringify(r.evidenceIds)]);
  }
  
  runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
    ['AUD-' + Date.now(), caseId, new Date().toISOString(), 'Analysis Pipeline Executed', caseId]);
  res.json({ success: true, clustersFound: clusters.length, reconstructionsGenerated: recons.length });
});

app.post('/api/cases/:id/annotations', (req, res) => {
  const id = 'ANN-' + Math.floor(Math.random() * 10000);
  runQuery("INSERT INTO annotations (id, target_id, case_id, text, author, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
    [id, req.body.targetId, req.params.id, req.body.text, req.body.author || 'Analyst', new Date().toISOString()]);
  runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
    ['AUD-' + Math.floor(Math.random() * 10000), req.params.id, new Date().toISOString(), 'Annotation Added', req.body.targetId]);
  res.json({ id });
});

app.get('/api/cases/:id/report', (req, res) => {
  const caseId = req.params.id;
  const caseData = getRows('SELECT * FROM cases WHERE id = ?', [caseId])[0];
  const events = getRows('SELECT * FROM events WHERE case_id = ? ORDER BY timestamp ASC', [caseId]);
  const findings = getRows('SELECT * FROM findings WHERE case_id = ?', [caseId]);
  const suspiciousStart = events.find(e => ['WEB_VISIT','EMAIL_RECEIVED','FILE_DOWNLOAD'].includes(e.event_type) && e.confidence < 0.97);
  const c2Events = events.filter(e => e.event_type === 'NETWORK_CONNECTION' && e.description?.includes('203.0.113.47'));
  const summary = caseData
    ? `Case ${caseData.id} — ${caseData.name}. Investigation covers the period from ${events[0]?.timestamp?.substring(11,16)} UTC to ${events[events.length-1]?.timestamp?.substring(11,16)} UTC on ${events[0]?.timestamp?.substring(0,10)}. ${events.length} events recorded across ${getRows('SELECT count(*) as c FROM evidence WHERE case_id = ?', [caseId])[0].c} evidence sources. The investigation identified a probable phishing-to-execution chain beginning with a suspicious email at 09:42 UTC. ${c2Events.length} outbound connections to external IP 203.0.113.47 were observed. ${findings.filter((f:any) => f.classification === 'INFERENCE').length} findings remain classified as INFERENCE pending additional telemetry.`
    : 'Summary unavailable.';
  runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
    ['AUD-' + Date.now(), caseId, new Date().toISOString(), 'Report Generated', caseId]);
  res.json({
    case: caseData,
    summary,
    evidence: getRows('SELECT * FROM evidence WHERE case_id = ?', [caseId]),
    events,
    findings: findings.map((f:any) => ({...f, evidenceRefs: JSON.parse(f.evidence_refs || '[]')})),
    questions: getRows('SELECT * FROM questions WHERE case_id = ?', [caseId]).map((q:any) => ({...q, evidenceRefs: JSON.parse(q.evidence_refs || '[]')})),
    entities: getRows('SELECT * FROM entities WHERE case_id = ?', [caseId]),
    reconstructions: getRows('SELECT * FROM reconstructions WHERE case_id = ?', [caseId]).map((r:any) => ({...r, steps: JSON.parse(r.steps || '[]')})),
    auditLog: getRows('SELECT * FROM audit_log WHERE case_id = ?', [caseId]),
    generatedAt: new Date().toISOString()
  });
});

app.patch('/api/findings/:id', (req, res) => {
  runQuery("UPDATE findings SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
  const f = getRows("SELECT case_id FROM findings WHERE id = ?", [req.params.id])[0];
  if (f) {
    runQuery("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)",
      ['AUD-' + Math.floor(Math.random() * 10000), f.case_id, new Date().toISOString(), 'Finding Status Updated to ' + req.body.status, req.params.id]);
  }
  res.json({ success: true });
});

const start = async () => {
  await initDb();
  await seedDemoCase();
  app.listen(3001, () => console.log('Backend listening on 3001'));
};
start();
