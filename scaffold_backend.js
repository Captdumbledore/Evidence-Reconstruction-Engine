const fs = require('fs');
const path = require('path');

const root = __dirname;
const bSrc = path.join(root, 'packages/backend/src');
const fSrc = path.join(root, 'packages/frontend/src');
const sSrc = path.join(root, 'packages/shared/src');

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// SHARED TYPES
ensureDir(sSrc);
fs.writeFileSync(path.join(sSrc, 'types.ts'), `
export enum EventType {
  LOGIN = 'LOGIN', LOGOUT = 'LOGOUT', PROCESS_START = 'PROCESS_START', PROCESS_END = 'PROCESS_END',
  FILE_CREATE = 'FILE_CREATE', FILE_MODIFY = 'FILE_MODIFY', FILE_DELETE = 'FILE_DELETE',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD', FILE_UPLOAD = 'FILE_UPLOAD', WEB_VISIT = 'WEB_VISIT',
  SEARCH = 'SEARCH', NETWORK_CONNECTION = 'NETWORK_CONNECTION', USB_CONNECT = 'USB_CONNECT',
  EMAIL_SENT = 'EMAIL_SENT', EMAIL_RECEIVED = 'EMAIL_RECEIVED', COMMAND_EXECUTION = 'COMMAND_EXECUTION',
  AUTHENTICATION_FAILURE = 'AUTHENTICATION_FAILURE', AUTHENTICATION_SUCCESS = 'AUTHENTICATION_SUCCESS', UNKNOWN = 'UNKNOWN'
}

export enum Classification {
  FACT = 'FACT', CORRELATED = 'CORRELATED', INFERENCE = 'INFERENCE', UNKNOWN = 'UNKNOWN'
}

export interface NormalizedEvent {
  id: string; caseId: string; timestamp: string; timestampConfidence: number;
  sourceType: string; eventType: EventType; actor: string | null; entity: string | null;
  description: string; location: string | null; confidence: number;
}
export interface EvidenceItem { id: string; caseId: string; filename: string; fileType: string; size: number; hash: string; uploadTimestamp: string; source: string; status: string; }
export interface Finding { id: string; caseId: string; description: string; classification: Classification; confidence: number; evidenceRefs: string[]; status: 'accepted'|'rejected'|'needs_investigation'; }
export interface Question { id: string; caseId: string; text: string; answer: string; confidence: number; evidenceRefs: string[]; missingEvidence: string[]; }
export interface AuditEntry { id: string; caseId: string; timestamp: string; action: string; target: string; }
export interface Annotation { id: string; targetId: string; text: string; author: string; timestamp: string; }
export interface CorrelationCluster { id: string; eventIds: string[]; rule: string; }
export interface GraphData { nodes: any[]; edges: any[]; }
`);

fs.writeFileSync(path.join(sSrc, 'index.ts'), `
export * from './types';
`);

// BACKEND DB
ensureDir(bSrc);
fs.writeFileSync(path.join(bSrc, 'db.ts'), `
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any = null;
const dbPath = path.resolve(__dirname, '../../reconstruct.db');

export const initDb = async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
  db = new SQL.Database(fileBuffer ?? undefined);
  
  db.run(\`
    CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, name TEXT, investigator TEXT, created_at TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, case_id TEXT, filename TEXT, file_type TEXT, size INTEGER, hash TEXT, upload_timestamp TEXT, source TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, case_id TEXT, timestamp TEXT, timestamp_confidence REAL, source_type TEXT, event_type TEXT, actor TEXT, entity TEXT, description TEXT, location TEXT, confidence REAL);
    CREATE TABLE IF NOT EXISTS correlations (id TEXT PRIMARY KEY, case_id TEXT, event_ids TEXT, rule TEXT);
    CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, case_id TEXT, type TEXT, value TEXT);
    CREATE TABLE IF NOT EXISTS findings (id TEXT PRIMARY KEY, case_id TEXT, description TEXT, classification TEXT, confidence REAL, evidence_refs TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, case_id TEXT, text TEXT, answer TEXT, confidence REAL, evidence_refs TEXT, missing_evidence TEXT);
    CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, target_id TEXT, text TEXT, author TEXT, timestamp TEXT);
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, case_id TEXT, timestamp TEXT, action TEXT, target TEXT);
  \`);
  saveDb();
};

export const saveDb = () => {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
};

export const runQuery = (sql: string, params: any[] = []) => {
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb();
};

export const getRows = (sql: string, params: any[] = []): any[] => {
  const stmt = db.prepare(sql);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

export const getDb = () => db;
`);

fs.writeFileSync(path.join(bSrc, 'seed.ts'), `
import { initDb, runQuery, getRows } from './db';
export const seedDemoCase = async () => {
  const cases = getRows('SELECT * FROM cases WHERE id = ?', ['CASE-2026-014']);
  if (cases.length === 0) {
    runQuery('INSERT INTO cases (id, name, investigator, created_at, status) VALUES (?, ?, ?, ?, ?)', ['CASE-2026-014', 'Suspicious Document Execution', 'System', new Date().toISOString(), 'open']);
    runQuery('INSERT INTO audit_log (id, case_id, timestamp, action, target) VALUES (?, ?, ?, ?, ?)', ['A1', 'CASE-2026-014', new Date().toISOString(), 'SEED', 'CASE-2026-014']);
    // Seed some mock events to make it look populated
    runQuery('INSERT INTO events (id, case_id, timestamp, timestamp_confidence, source_type, event_type, actor, entity, description, location, confidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ['E1', 'CASE-2026-014', new Date().toISOString(), 1.0, 'syslog', 'PROCESS_START', 'user1', 'malware.exe', 'Process started', 'C:\\malware.exe', 0.9]);
    runQuery('INSERT INTO findings (id, case_id, description, classification, confidence, evidence_refs, status) VALUES (?, ?, ?, ?, ?, ?, ?)', ['F1', 'CASE-2026-014', 'Malware executed', 'FACT', 0.95, '["E1"]', 'accepted']);
  }
};
`);

ensureDir(path.join(bSrc, 'services'));
fs.writeFileSync(path.join(bSrc, 'services', 'hasher.ts'), `export const hashBuffer = (buf: Buffer) => "hash";`);
ensureDir(path.join(bSrc, 'services', 'parser'));
fs.writeFileSync(path.join(bSrc, 'services', 'parser', 'csvParser.ts'), `export const parseCsv = (buf: Buffer) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'parser', 'jsonParser.ts'), `export const parseJson = (buf: Buffer) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'parser', 'logParser.ts'), `export const parseLog = (buf: Buffer) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'normalizer.ts'), `export const normalize = (events: any[]) => events;`);
fs.writeFileSync(path.join(bSrc, 'services', 'entityExtractor.ts'), `export const extractEntities = (events: any[]) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'correlationEngine.ts'), `export const correlate = (events: any[]) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'reconstructionEngine.ts'), `export const reconstruct = (clusters: any[]) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'hypothesisEngine.ts'), `export const generateHypotheses = (events: any[]) => [];`);
fs.writeFileSync(path.join(bSrc, 'services', 'confidenceEstimator.ts'), `export const estimateConfidence = () => 1.0;`);

fs.writeFileSync(path.join(bSrc, 'index.ts'), `
import express from 'express';
import cors from 'cors';
import { initDb, getRows, runQuery } from './db';
import { seedDemoCase } from './seed';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/cases', (req, res) => res.json(getRows('SELECT * FROM cases')));
app.post('/api/cases', (req, res) => res.json({}));
app.get('/api/cases/:id', (req, res) => {
  const c = getRows('SELECT * FROM cases WHERE id = ?', [req.params.id])[0];
  if (!c) return res.status(404).json({error: 'not found'});
  res.json({ ...c, stats: { events: 1, evidence: 0, entities: 0, findings: 1 } });
});
app.get('/api/cases/:id/events', (req, res) => res.json(getRows('SELECT * FROM events WHERE case_id = ?', [req.params.id])));
app.get('/api/cases/:id/timeline', (req, res) => res.json([]));
app.get('/api/cases/:id/graph', (req, res) => res.json({nodes: [], edges: []}));
app.get('/api/cases/:id/findings', (req, res) => res.json(getRows('SELECT * FROM findings WHERE case_id = ?', [req.params.id]).map(f => ({...f, evidenceRefs: JSON.parse(f.evidence_refs || '[]')} ))));
app.get('/api/cases/:id/questions', (req, res) => res.json([]));
app.get('/api/cases/:id/audit', (req, res) => res.json(getRows('SELECT * FROM audit_log WHERE case_id = ?', [req.params.id])));
app.get('/api/cases/:id/evidence', (req, res) => res.json([]));
app.post('/api/cases/:id/evidence', (req, res) => res.json({}));
app.post('/api/cases/:id/analyze', (req, res) => res.json({}));
app.post('/api/cases/:id/annotations', (req, res) => res.json({}));
app.get('/api/cases/:id/report', (req, res) => res.json({}));
app.patch('/api/findings/:id', (req, res) => res.json({}));

const start = async () => {
  await initDb();
  await seedDemoCase();
  app.listen(3000, () => console.log('Backend listening on 3000'));
};
start();
`);

console.log('Backend skeleton created.');
