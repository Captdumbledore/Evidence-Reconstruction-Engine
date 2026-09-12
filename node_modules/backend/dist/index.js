"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const db_1 = require("./db");
const seed_1 = require("./seed");
const correlationEngine_1 = require("./services/correlationEngine");
const reconstructionEngine_1 = require("./services/reconstructionEngine");
const hasher_1 = require("./services/hasher");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (_req, file, cb) => {
        // Allow only safe non-executable types
        const allowed = ['.csv', '.json', '.log', '.txt', '.png', '.jpg', '.jpeg', '.gif', '.pdf'];
        const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type not allowed: ${ext}`));
        }
    }
});
app.get('/api/cases', (req, res) => res.json((0, db_1.getRows)('SELECT * FROM cases')));
app.post('/api/cases', (req, res) => {
    const id = 'CASE-' + Math.floor(Math.random() * 100000);
    (0, db_1.runQuery)("INSERT INTO cases (id, name, investigator, created_at, status, description) VALUES (?, ?, ?, ?, ?, ?)", [id, req.body.name, req.body.investigator, new Date().toISOString(), 'active', req.body.description]);
    res.json({ id });
});
app.get('/api/cases/:id', (req, res) => {
    const c = (0, db_1.getRows)('SELECT * FROM cases WHERE id = ?', [req.params.id])[0];
    if (!c)
        return res.status(404).json({ error: 'not found' });
    const events = (0, db_1.getRows)('SELECT count(id) as c FROM events WHERE case_id = ?', [req.params.id])[0].c;
    const evidence = (0, db_1.getRows)('SELECT count(id) as c FROM evidence WHERE case_id = ?', [req.params.id])[0].c;
    const entities = (0, db_1.getRows)('SELECT count(id) as c FROM entities WHERE case_id = ?', [req.params.id])[0].c;
    const findings = (0, db_1.getRows)('SELECT count(id) as c FROM findings WHERE case_id = ? AND confidence >= 0.8', [req.params.id])[0].c;
    res.json({ ...c, stats: { events, evidence, entities, findings } });
});
app.get('/api/cases/:id/events', (req, res) => {
    let sql = 'SELECT * FROM events WHERE case_id = ?';
    const params = [req.params.id];
    if (req.query.source) {
        sql += ' AND source_type = ?';
        params.push(req.query.source);
    }
    if (req.query.event_type) {
        sql += ' AND event_type = ?';
        params.push(req.query.event_type);
    }
    if (req.query.actor) {
        sql += ' AND actor = ?';
        params.push(req.query.actor);
    }
    if (req.query.min_confidence) {
        sql += ' AND confidence >= ?';
        params.push(req.query.min_confidence);
    }
    if (req.query.start_time) {
        sql += ' AND timestamp >= ?';
        params.push(req.query.start_time);
    }
    if (req.query.end_time) {
        sql += ' AND timestamp <= ?';
        params.push(req.query.end_time);
    }
    sql += ' ORDER BY timestamp ASC';
    res.json((0, db_1.getRows)(sql, params).map(e => ({ ...e, evidenceIds: JSON.parse(e.evidence_refs || '[]') })));
});
app.get('/api/cases/:id/timeline', (req, res) => {
    const events = (0, db_1.getRows)('SELECT * FROM events WHERE case_id = ? ORDER BY timestamp ASC', [req.params.id]);
    const lanesMap = {
        browser: { id: 'browser', label: 'Browser', events: [] },
        auth: { id: 'auth', label: 'Authentication', events: [] },
        files: { id: 'filesystem', label: 'Files', events: [] },
        process: { id: 'process', label: 'Processes', events: [] },
        network: { id: 'network', label: 'Network', events: [] },
        email: { id: 'email', label: 'Email', events: [] }
    };
    events.forEach(e => {
        let lane = 'files';
        if (e.source_type === 'browser')
            lane = 'browser';
        else if (e.source_type === 'auth')
            lane = 'auth';
        else if (e.source_type === 'process')
            lane = 'process';
        else if (e.source_type === 'network')
            lane = 'network';
        else if (e.source_type === 'email')
            lane = 'email';
        if (lanesMap[lane])
            lanesMap[lane].events.push({ ...e, evidenceIds: JSON.parse(e.evidence_refs || '[]') });
    });
    const correlations = (0, db_1.getRows)('SELECT * FROM correlations WHERE case_id = ?', [req.params.id]).map(c => ({
        ...c, eventIds: JSON.parse(c.event_ids || '[]'), evidenceIds: JSON.parse(c.evidence_ids || '[]'), factors: JSON.parse(c.factors || '{}')
    }));
    res.json({
        lanes: Object.values(lanesMap),
        timeRange: { start: events[0]?.timestamp, end: events[events.length - 1]?.timestamp },
        correlations
    });
});
app.get('/api/cases/:id/graph', (req, res) => {
    const entities = (0, db_1.getRows)('SELECT * FROM entities WHERE case_id = ?', [req.params.id]);
    const events = (0, db_1.getRows)('SELECT * FROM events WHERE case_id = ?', [req.params.id]);
    // Hierarchical layout: assign y-tier by entity type
    const tierY = {
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
    const tierCounts = {};
    const tierIdx = {};
    const nodes = entities.map((ent) => {
        const tier = ent.type in tierY ? ent.type : 'file';
        tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        return { ent, tier };
    });
    // Count per tier for centering
    const tierTotal = {};
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
    const edgeSet = new Set();
    const edges = [];
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
app.get('/api/cases/:id/findings', (req, res) => res.json((0, db_1.getRows)('SELECT * FROM findings WHERE case_id = ?', [req.params.id]).map(f => ({ ...f, evidenceRefs: JSON.parse(f.evidence_refs || '[]') }))));
app.get('/api/cases/:id/questions', (req, res) => res.json((0, db_1.getRows)('SELECT * FROM questions WHERE case_id = ?', [req.params.id]).map(q => ({ ...q, evidenceRefs: JSON.parse(q.evidence_refs || '[]') }))));
app.get('/api/cases/:id/audit', (req, res) => res.json((0, db_1.getRows)('SELECT * FROM audit_log WHERE case_id = ? ORDER BY timestamp DESC', [req.params.id])));
app.get('/api/cases/:id/evidence', (req, res) => {
    const ev = (0, db_1.getRows)('SELECT * FROM evidence WHERE case_id = ?', [req.params.id]);
    // Log audit
    (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Date.now(), req.params.id, new Date().toISOString(), 'Evidence List Viewed', req.params.id]);
    res.json(ev);
});
// Evidence upload
app.post('/api/cases/:id/evidence', upload.single('file'), (req, res) => {
    if (!req.file)
        return res.status(400).json({ error: 'No file uploaded' });
    const caseId = req.params.id;
    const file = req.file;
    const sha256 = (0, hasher_1.hashBuffer)(file.buffer);
    const evId = 'EV-' + String((0, db_1.getRows)('SELECT count(*) as c FROM evidence WHERE case_id = ?', [caseId])[0].c + 1).padStart(3, '0');
    const sourceType = req.body.sourceType || 'unknown';
    const now = new Date().toISOString();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/\.{2,}/g, '.');
    (0, db_1.runQuery)("INSERT INTO evidence (id, case_id, filename, source_type, size, sha256, upload_timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [evId, caseId, safeName, sourceType, file.size, sha256, now, 'verified']);
    (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Date.now(), caseId, now, 'Evidence Uploaded', evId]);
    // MOCK EXTRACTION: Generate some simulated events for the user to test the re-evaluation engine
    const eventCount = (0, db_1.getRows)('SELECT count(*) as c FROM events WHERE case_id = ?', [caseId])[0].c;
    const newTimestamp = new Date(Date.now() - 3600000).toISOString();
    (0, db_1.runQuery)("INSERT INTO events (id, case_id, timestamp, source_type, event_type, actor, action, description, confidence, evidence_refs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        `EVT-${String(eventCount + 1).padStart(3, '0')}`, caseId, newTimestamp, sourceType, 'FILE_ACCESS', 'analyst01', 'read', `Extracted artifact analysis from ${safeName}`, 0.95, JSON.stringify([evId])
    ]);
    (0, db_1.runQuery)("INSERT INTO events (id, case_id, timestamp, source_type, event_type, actor, action, description, confidence, evidence_refs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
        `EVT-${String(eventCount + 2).padStart(3, '0')}`, caseId, newTimestamp, sourceType, 'NETWORK_CONNECTION', 'analyst01', 'connect', `Suspicious connection traced back to ${safeName}`, 0.82, JSON.stringify([evId])
    ]);
    res.json({ id: evId, filename: safeName, sha256, size: file.size, status: 'verified', upload_timestamp: now });
});
app.post('/api/cases/:id/analyze', (req, res) => {
    const caseId = req.params.id;
    const clusters = (0, correlationEngine_1.runCorrelation)(caseId);
    (0, db_1.runQuery)("DELETE FROM correlations WHERE case_id = ?", [caseId]);
    for (const c of clusters) {
        (0, db_1.runQuery)("INSERT INTO correlations (id, case_id, name, description, event_ids, evidence_ids, rule, confidence, classification, factors) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [c.id, caseId, c.name, c.description, JSON.stringify(c.eventIds), JSON.stringify(c.evidenceIds), c.rule, c.confidence, c.classification, JSON.stringify(c.factors)]);
    }
    const recons = (0, reconstructionEngine_1.runReconstruction)(caseId, clusters);
    (0, db_1.runQuery)("DELETE FROM reconstructions WHERE case_id = ?", [caseId]);
    for (const r of recons) {
        (0, db_1.runQuery)("INSERT INTO reconstructions (id, case_id, name, description, steps, confidence, classification, evidence_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [r.id, caseId, r.name, r.description, JSON.stringify(r.steps), r.confidence, r.classification, JSON.stringify(r.evidenceIds)]);
    }
    (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Date.now(), caseId, new Date().toISOString(), 'Analysis Pipeline Executed', caseId]);
    res.json({ success: true, clustersFound: clusters.length, reconstructionsGenerated: recons.length });
});
app.post('/api/cases/:id/annotations', (req, res) => {
    const id = 'ANN-' + Math.floor(Math.random() * 10000);
    (0, db_1.runQuery)("INSERT INTO annotations (id, target_id, case_id, text, author, timestamp) VALUES (?, ?, ?, ?, ?, ?)", [id, req.body.targetId, req.params.id, req.body.text, req.body.author || 'Analyst', new Date().toISOString()]);
    (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Math.floor(Math.random() * 10000), req.params.id, new Date().toISOString(), 'Annotation Added', req.body.targetId]);
    res.json({ id });
});
app.get('/api/cases/:id/report', (req, res) => {
    const caseId = req.params.id;
    const caseData = (0, db_1.getRows)('SELECT * FROM cases WHERE id = ?', [caseId])[0];
    const events = (0, db_1.getRows)('SELECT * FROM events WHERE case_id = ? ORDER BY timestamp ASC', [caseId]);
    const findings = (0, db_1.getRows)('SELECT * FROM findings WHERE case_id = ?', [caseId]);
    const suspiciousStart = events.find(e => ['WEB_VISIT', 'EMAIL_RECEIVED', 'FILE_DOWNLOAD'].includes(e.event_type) && e.confidence < 0.97);
    const c2Events = events.filter(e => e.event_type === 'NETWORK_CONNECTION' && e.description?.includes('203.0.113.47'));
    const summary = caseData
        ? `Case ${caseData.id} — ${caseData.name}. Investigation covers the period from ${events[0]?.timestamp?.substring(11, 16)} UTC to ${events[events.length - 1]?.timestamp?.substring(11, 16)} UTC on ${events[0]?.timestamp?.substring(0, 10)}. ${events.length} events recorded across ${(0, db_1.getRows)('SELECT count(*) as c FROM evidence WHERE case_id = ?', [caseId])[0].c} evidence sources. The investigation identified a probable phishing-to-execution chain beginning with a suspicious email at 09:42 UTC. ${c2Events.length} outbound connections to external IP 203.0.113.47 were observed. ${findings.filter((f) => f.classification === 'INFERENCE').length} findings remain classified as INFERENCE pending additional telemetry.`
        : 'Summary unavailable.';
    (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Date.now(), caseId, new Date().toISOString(), 'Report Generated', caseId]);
    res.json({
        case: caseData,
        summary,
        evidence: (0, db_1.getRows)('SELECT * FROM evidence WHERE case_id = ?', [caseId]),
        events,
        findings: findings.map((f) => ({ ...f, evidenceRefs: JSON.parse(f.evidence_refs || '[]') })),
        questions: (0, db_1.getRows)('SELECT * FROM questions WHERE case_id = ?', [caseId]).map((q) => ({ ...q, evidenceRefs: JSON.parse(q.evidence_refs || '[]') })),
        entities: (0, db_1.getRows)('SELECT * FROM entities WHERE case_id = ?', [caseId]),
        reconstructions: (0, db_1.getRows)('SELECT * FROM reconstructions WHERE case_id = ?', [caseId]).map((r) => ({ ...r, steps: JSON.parse(r.steps || '[]') })),
        auditLog: (0, db_1.getRows)('SELECT * FROM audit_log WHERE case_id = ?', [caseId]),
        generatedAt: new Date().toISOString()
    });
});
app.patch('/api/findings/:id', (req, res) => {
    (0, db_1.runQuery)("UPDATE findings SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
    const f = (0, db_1.getRows)("SELECT case_id FROM findings WHERE id = ?", [req.params.id])[0];
    if (f) {
        (0, db_1.runQuery)("INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)", ['AUD-' + Math.floor(Math.random() * 10000), f.case_id, new Date().toISOString(), 'Finding Status Updated to ' + req.body.status, req.params.id]);
    }
    res.json({ success: true });
});
const start = async () => {
    await (0, db_1.initDb)();
    await (0, seed_1.seedDemoCase)();
    app.listen(3001, () => console.log('Backend listening on 3001'));
};
start();
