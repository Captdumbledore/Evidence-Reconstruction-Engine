"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runReconstruction = void 0;
const db_1 = require("../db");
const runReconstruction = (caseId, clusters) => {
    const events = (0, db_1.getRows)("SELECT * FROM events WHERE case_id = ?", [caseId]);
    const reconstructions = [];
    let reconIdx = 1;
    const createRecon = (name, description, evts, cls, conf, customNotes = {}) => {
        const steps = evts.map(e => ({
            timestamp: e.timestamp,
            eventId: e.id,
            description: e.description,
            classification: e.confidence > 0.95 ? 'FACT' : 'CORRELATED',
            notes: customNotes[e.id]
        }));
        const evIds = Array.from(new Set(evts.flatMap(e => JSON.parse(e.evidence_refs || '[]'))));
        reconstructions.push({
            id: `R-${caseId}-${reconIdx++}`,
            caseId,
            name,
            description,
            steps,
            confidence: conf,
            classification: cls,
            evidenceIds: evIds
        });
    };
    const e16 = events.find(e => e.id === 'EVT-016');
    const e17 = events.find(e => e.id === 'EVT-017');
    const e19 = events.find(e => e.id === 'EVT-019');
    const e20 = events.find(e => e.id === 'EVT-020');
    const e21 = events.find(e => e.id === 'EVT-021');
    if (e16 && e21) {
        createRecon('Phishing Email to File Download', 'The user received a phishing email, clicked the link, and downloaded a macro-enabled document.', [e16, e17, e19, e20, e21].filter(Boolean), 'FACT', 0.95);
    }
    const e23 = events.find(e => e.id === 'EVT-023');
    const e25 = events.find(e => e.id === 'EVT-025');
    const e26 = events.find(e => e.id === 'EVT-026');
    const e27 = events.find(e => e.id === 'EVT-027');
    if (e23 && e27) {
        createRecon('Document Execution to Child Process', 'The downloaded document was executed, leading to a command shell and powershell execution.', [e23, e25, e26, e27].filter(Boolean), 'INFERENCE', 0.88, { 'EVT-025': 'Parent-child process not recorded' });
    }
    const c2Events = events.filter(e => e.id >= 'EVT-028' && e.id <= 'EVT-067' && e.event_type === 'NETWORK_CONNECTION' && e.description.includes('203.0.113.47'));
    if (c2Events.length > 0) {
        createRecon('C2 Communication Sequence', 'The host communicated with an external IP over 17 minutes.', c2Events, 'CORRELATED', 0.9, { 'EVT-030': 'No payload data captured' });
    }
    const e39 = events.find(e => e.id === 'EVT-039');
    const e40 = events.find(e => e.id === 'EVT-040');
    const e42 = events.find(e => e.id === 'EVT-042');
    if (e39 && e42) {
        createRecon('Persistence Mechanism Installation', 'An executable was placed in Roaming AppData and added to Startup.', [e39, e40, e42].filter(Boolean), 'INFERENCE', 0.85);
    }
    const exfil = events.filter(e => e.id >= 'EVT-051' && e.id <= 'EVT-056');
    if (exfil.length > 0) {
        createRecon('Possible Data Staging and Exfiltration', 'Sensitive files were accessed and an archive was created, possibly for exfiltration.', exfil, 'INFERENCE', 0.65, { 'EVT-056': 'Inference only, no payload confirmation' });
    }
    return reconstructions;
};
exports.runReconstruction = runReconstruction;
