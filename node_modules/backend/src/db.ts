import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: any = null;
const dbPath = path.resolve(__dirname, '../../reconstruct.db');

export const initDb = async () => {
  const SQL = await initSqlJs();
  const fileBuffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
  db = new SQL.Database(fileBuffer ?? undefined);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, name TEXT, investigator TEXT, created_at TEXT, status TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS evidence (id TEXT PRIMARY KEY, case_id TEXT, filename TEXT, file_type TEXT, size INTEGER, hash TEXT, upload_timestamp TEXT, source TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, case_id TEXT, timestamp TEXT, timestamp_confidence REAL, source_type TEXT, event_type TEXT, actor TEXT, entity TEXT, description TEXT, location TEXT, confidence REAL, evidence_refs TEXT);
    CREATE TABLE IF NOT EXISTS correlations (id TEXT PRIMARY KEY, case_id TEXT, name TEXT, description TEXT, event_ids TEXT, evidence_ids TEXT, rule TEXT, confidence REAL, classification TEXT, factors TEXT);
    CREATE TABLE IF NOT EXISTS entities (id TEXT PRIMARY KEY, case_id TEXT, type TEXT, value TEXT, first_seen TEXT, last_seen TEXT);
    CREATE TABLE IF NOT EXISTS findings (id TEXT PRIMARY KEY, case_id TEXT, description TEXT, classification TEXT, confidence REAL, evidence_refs TEXT, status TEXT, supporting TEXT, contradicting TEXT);
    CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, case_id TEXT, text TEXT, answer TEXT, confidence REAL, evidence_refs TEXT, missing_evidence TEXT);
    CREATE TABLE IF NOT EXISTS annotations (id TEXT PRIMARY KEY, target_id TEXT, case_id TEXT, text TEXT, author TEXT, timestamp TEXT);
    CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, case_id TEXT, timestamp TEXT, action TEXT, target TEXT);
    CREATE TABLE IF NOT EXISTS reconstructions (id TEXT PRIMARY KEY, case_id TEXT, name TEXT, description TEXT, steps TEXT, confidence REAL, classification TEXT, evidence_ids TEXT);
  `);
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
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

export const getDb = () => db;
