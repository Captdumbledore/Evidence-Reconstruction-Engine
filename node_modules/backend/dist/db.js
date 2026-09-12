"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = exports.getRows = exports.runQuery = exports.saveDb = exports.initDb = void 0;
const sql_js_1 = __importDefault(require("sql.js"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let db = null;
const dbPath = path_1.default.resolve(__dirname, '../../reconstruct.db');
const initDb = async () => {
    const SQL = await (0, sql_js_1.default)();
    const fileBuffer = fs_1.default.existsSync(dbPath) ? fs_1.default.readFileSync(dbPath) : null;
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
    (0, exports.saveDb)();
};
exports.initDb = initDb;
const saveDb = () => {
    if (db) {
        const data = db.export();
        fs_1.default.writeFileSync(dbPath, Buffer.from(data));
    }
};
exports.saveDb = saveDb;
const runQuery = (sql, params = []) => {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
    (0, exports.saveDb)();
};
exports.runQuery = runQuery;
const getRows = (sql, params = []) => {
    const stmt = db.prepare(sql);
    if (params && params.length > 0) {
        stmt.bind(params);
    }
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
};
exports.getRows = getRows;
const getDb = () => db;
exports.getDb = getDb;
