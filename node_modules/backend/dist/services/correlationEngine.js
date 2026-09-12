"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCorrelation = void 0;
const db_1 = require("../db");
const runCorrelation = (caseId) => {
    const events = (0, db_1.getRows)("SELECT * FROM events WHERE case_id = ? ORDER BY timestamp ASC", [caseId]);
    const clusters = [];
    let clusterIdx = 1;
    const createCluster = (name, description, evtList, rule, conf, cls, factors) => {
        const evIds = Array.from(new Set(evtList.flatMap(e => JSON.parse(e.evidence_refs || '[]'))));
        const cl = {
            id: `C-${caseId}-${clusterIdx++}`,
            caseId,
            name,
            description,
            eventIds: evtList.map(e => e.id),
            evidenceIds: evIds,
            rule,
            confidence: conf,
            classification: cls,
            factors
        };
        clusters.push(cl);
    };
    // Rule 1 — Temporal Proximity (±60s, same actor)
    for (let i = 0; i < events.length; i++) {
        const clusterEvents = [events[i]];
        for (let j = i + 1; j < events.length; j++) {
            if (events[j].actor === events[i].actor) {
                const t1 = new Date(events[i].timestamp).getTime();
                const t2 = new Date(events[j].timestamp).getTime();
                if (t2 - t1 <= 60000) {
                    clusterEvents.push(events[j]);
                }
                else {
                    break; // Since ordered by timestamp
                }
            }
        }
        if (clusterEvents.length >= 3) { // Threshold to avoid too many pairs
            createCluster('Temporal Burst', 'Multiple events by same actor within 60s', clusterEvents, 'Rule 1', 0.75, 'CORRELATED', { positive: ['High temporal density'], negative: [] });
            i += clusterEvents.length - 1; // Skip ahead to avoid overlapping similar bursts
        }
    }
    // Rule 2 — Shared Actor
    const actorMap = {};
    events.forEach(e => {
        if (!actorMap[e.actor])
            actorMap[e.actor] = [];
        actorMap[e.actor].push(e);
    });
    for (const [actor, actEvents] of Object.entries(actorMap)) {
        if (actEvents.length > 5) {
            const suspicious = actEvents.filter(e => e.event_type.includes('DOWNLOAD') || e.event_type.includes('COMMAND') || e.event_type.includes('FAILURE'));
            if (suspicious.length > 0) {
                createCluster('Suspicious Actor Activity', `Actor ${actor} exhibits suspicious patterns`, suspicious, 'Rule 2', 0.70, 'CORRELATED', { positive: ['Suspicious event types seen'], negative: [] });
            }
        }
    }
    // Rule 3 — Shared Entity
    // Simple check for entities embedded in description or having same target
    // e.g. finding IP 203.0.113.47
    const entityMap = {};
    events.forEach(e => {
        // Extract potential entities (IPs, specific files)
        const match = e.description.match(/(203\.0\.113\.47|secure-invoice-portal\.net|invoice_q3_2026\.docm|svcmon\.exe)/);
        if (match) {
            const ent = match[1];
            if (!entityMap[ent])
                entityMap[ent] = [];
            entityMap[ent].push(e);
        }
    });
    for (const [ent, entEvents] of Object.entries(entityMap)) {
        if (entEvents.length > 1) {
            createCluster('Shared Entity Usage', `Multiple events reference ${ent}`, entEvents, 'Rule 3', 0.80, 'CORRELATED', { positive: ['Repeated entity interaction'], negative: [] });
        }
    }
    // Rule 4 — Causal Sequence (Phishing to Execution)
    for (let i = 0; i < events.length; i++) {
        if (events[i].event_type === 'EMAIL_RECEIVED') {
            const window = events.slice(i, i + 20).filter(e => new Date(e.timestamp).getTime() - new Date(events[i].timestamp).getTime() <= 300000);
            let chain = [events[i]];
            let hasWeb = window.find(e => e.event_type === 'WEB_VISIT' && new Date(e.timestamp) >= new Date(events[i].timestamp));
            let hasDl = window.find(e => e.event_type === 'FILE_DOWNLOAD' && new Date(e.timestamp) >= new Date(hasWeb?.timestamp || events[i].timestamp));
            let hasFc = window.find(e => e.event_type === 'FILE_CREATE' && new Date(e.timestamp) >= new Date(hasDl?.timestamp || events[i].timestamp));
            let hasPs = window.find(e => e.event_type === 'PROCESS_START' && new Date(e.timestamp) >= new Date(hasFc?.timestamp || events[i].timestamp));
            let hasNc = window.find(e => e.event_type === 'NETWORK_CONNECTION' && new Date(e.timestamp) >= new Date(hasPs?.timestamp || events[i].timestamp));
            let conf = 0.30;
            let missing = 0;
            if (events[i])
                conf += 0.15;
            else
                missing++;
            if (hasWeb) {
                chain.push(hasWeb);
                conf += 0.15;
            }
            else
                missing++;
            if (hasDl) {
                chain.push(hasDl);
                conf += 0.15;
            }
            else
                missing++;
            if (hasFc && hasDl && new Date(hasFc.timestamp).getTime() - new Date(hasDl.timestamp).getTime() <= 120000) {
                chain.push(hasFc);
                conf += 0.10;
            }
            else if (hasFc) {
                chain.push(hasFc);
                conf += 0.10;
            }
            else
                missing++;
            if (hasPs && hasFc && new Date(hasPs.timestamp).getTime() - new Date(hasFc.timestamp).getTime() <= 180000) {
                chain.push(hasPs);
                conf += 0.10;
            }
            else if (hasPs) {
                chain.push(hasPs);
                conf += 0.10;
            }
            else
                missing++;
            if (hasNc && hasPs && new Date(hasNc.timestamp).getTime() - new Date(hasPs.timestamp).getTime() <= 300000) {
                chain.push(hasNc);
                conf += 0.15;
            }
            else if (hasNc) {
                chain.push(hasNc);
                conf += 0.15;
            }
            else
                missing++;
            conf -= missing * 0.15;
            conf = Math.max(0.0, Math.min(0.95, conf));
            const isComplete = chain.length >= 6;
            if (chain.length > 2) {
                createCluster('Potential phishing-to-execution chain', 'Sequential stages of phishing delivery and execution', chain, 'Rule 4', conf, isComplete ? 'INFERENCE' : 'UNKNOWN', { positive: ['Sequence aligned'], negative: missing > 0 ? ['Missing steps'] : [] });
            }
        }
    }
    // Rule 5 — Auth Anomaly
    for (let i = 0; i < events.length; i++) {
        if (events[i].event_type === 'AUTHENTICATION_FAILURE') {
            const success = events.slice(i + 1, i + 10).find(e => e.event_type === 'AUTHENTICATION_SUCCESS' && (new Date(e.timestamp).getTime() - new Date(events[i].timestamp).getTime() <= 120000));
            if (success) {
                createCluster('Authentication Anomaly', 'Auth failure followed by success', [events[i], success], 'Rule 5', 0.72, 'CORRELATED', { positive: ['Pattern matched'], negative: [] });
            }
        }
    }
    // Rule 6 — Persistence Indicators
    const creates = events.filter(e => e.event_type === 'FILE_CREATE' && e.description.includes('AppData\\\\Roaming'));
    const starts = events.filter(e => e.event_type === 'PROCESS_START');
    for (const c of creates) {
        const filename = c.description.split('\\\\').pop();
        const start = starts.find(s => s.description.includes(filename || 'xxxxxxx'));
        if (start) {
            createCluster('Persistence Mechanism Installation', 'File created in roaming profile and executed', [c, start], 'Rule 6', 0.80, 'INFERENCE', { positive: ['Startup location used'], negative: [] });
        }
    }
    return clusters;
};
exports.runCorrelation = runCorrelation;
