"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoCase = void 0;
const db_1 = require("./db");
const seedDemoCase = async () => {
    const existing = (0, db_1.getRows)("SELECT id FROM cases WHERE id = 'CASE-2026-014'");
    if (existing.length > 0)
        return; // already seeded
    (0, db_1.runQuery)("INSERT INTO cases (id, name, investigator, created_at, status, description) VALUES (?, ?, ?, ?, ?, ?)", [
        'CASE-2026-014',
        'Suspicious Document Execution',
        'Investigator-1',
        '2026-09-10T09:28:00Z',
        'active',
        'Workstation WS-104 belonging to analyst01 exhibits suspicious activity pattern consistent with spear-phishing execution chain.'
    ]);
    const evidence = [
        { id: 'EV-001', fn: 'browser_history.csv', src: 'browser', sz: 18432, h: 'a84d3f...91bc' },
        { id: 'EV-002', fn: 'authentication.log', src: 'auth', sz: 9216, h: 'b92e1a...44df' },
        { id: 'EV-003', fn: 'file_activity.csv', src: 'filesystem', sz: 14336, h: 'c71f8b...22ae' },
        { id: 'EV-004', fn: 'process_events.csv', src: 'process', sz: 11264, h: 'd33c9e...77f1' },
        { id: 'EV-005', fn: 'network_connections.csv', src: 'network', sz: 8192, h: 'e55a2d...88cc' },
        { id: 'EV-006', fn: 'email_events.csv', src: 'email', sz: 6144, h: 'f19b4c...55ab' }
    ];
    for (const e of evidence) {
        (0, db_1.runQuery)("INSERT INTO evidence (id, case_id, filename, file_type, size, hash, upload_timestamp, source, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            e.id, 'CASE-2026-014', e.fn, e.fn.split('.').pop(), e.sz, e.h, '2026-09-10T12:00:00Z', e.src, 'verified'
        ]);
    }
    const rawEvents = `
1. EVT-001 09:28:14 AUTH LOGIN analyst01 WS-104 confidence:0.99 FACT ev:EV-002
2. EVT-002 09:29:02 WEB_VISIT analyst01 news.bbc.co.uk confidence:0.98 FACT ev:EV-001
3. EVT-003 09:29:45 WEB_VISIT analyst01 mail.company.internal confidence:0.98 FACT ev:EV-001
4. EVT-004 09:30:11 EMAIL_RECEIVED analyst01 from:hr@company.internal subject:"Q3 Review Schedule" confidence:0.97 FACT ev:EV-006
5. EVT-005 09:31:03 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\report_draft.docx confidence:0.96 FACT ev:EV-003
6. EVT-006 09:32:17 WEB_VISIT analyst01 www.microsoft.com confidence:0.98 FACT ev:EV-001
7. EVT-007 09:33:55 PROCESS_START analyst01 WINWORD.EXE confidence:0.97 FACT ev:EV-004
8. EVT-008 09:34:22 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\quarterly_review.docx confidence:0.96 FACT ev:EV-003
9. EVT-009 09:35:41 NETWORK_CONNECTION analyst01 172.16.0.5:443 confidence:0.95 FACT ev:EV-005
10. EVT-010 09:36:08 WEB_VISIT analyst01 sharepoint.company.internal confidence:0.98 FACT ev:EV-001
11. EVT-011 09:37:19 EMAIL_RECEIVED analyst01 from:newsletter@industry-news.io subject:"Weekly Security Digest" confidence:0.96 FACT ev:EV-006
12. EVT-012 09:38:44 SEARCH analyst01 "invoice template Q3 2026" confidence:0.95 FACT ev:EV-001
13. EVT-013 09:39:12 WEB_VISIT analyst01 docs.google.com confidence:0.97 FACT ev:EV-001
14. EVT-014 09:40:05 FILE_CREATE analyst01 C:\\Users\\analyst01\\Desktop\\notes.txt confidence:0.96 FACT ev:EV-003
15. EVT-015 09:41:33 WEB_VISIT analyst01 accounts.google.com confidence:0.97 FACT ev:EV-001
16. EVT-016 09:42:07 EMAIL_RECEIVED analyst01 from:billing@secure-invoice-portal.net subject:"ACTION REQUIRED: Invoice #INV-2026-8841" confidence:0.97 FACT ev:EV-006
17. EVT-017 09:42:38 WEB_VISIT analyst01 secure-invoice-portal.net confidence:0.97 FACT ev:EV-001
18. EVT-018 09:42:51 SEARCH analyst01 "secure-invoice-portal.net" confidence:0.95 FACT ev:EV-001
19. EVT-019 09:43:09 WEB_VISIT analyst01 secure-invoice-portal.net/download/invoice_q3_2026.docm confidence:0.97 FACT ev:EV-001
20. EVT-020 09:43:22 FILE_DOWNLOAD analyst01 invoice_q3_2026.docm from:secure-invoice-portal.net confidence:0.96 FACT ev:EV-001
21. EVT-021 09:43:36 FILE_CREATE analyst01 C:\\Users\\analyst01\\Downloads\\invoice_q3_2026.docm confidence:0.97 FACT ev:EV-003
22. EVT-022 09:44:01 WEB_VISIT analyst01 www.office.com confidence:0.97 FACT ev:EV-001
23. EVT-023 09:44:18 PROCESS_START analyst01 WINWORD.EXE args:invoice_q3_2026.docm confidence:0.97 FACT ev:EV-004
24. EVT-024 09:44:31 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Downloads\\invoice_q3_2026.docm confidence:0.94 FACT ev:EV-003
25. EVT-025 09:45:02 PROCESS_START analyst01 cmd.exe confidence:0.88 FACT ev:EV-004
26. EVT-026 09:45:14 COMMAND_EXECUTION analyst01 "powershell.exe -enc [base64string]" confidence:0.91 FACT ev:EV-004
27. EVT-027 09:45:28 PROCESS_START analyst01 powershell.exe args:"-enc JABzAGUA..." confidence:0.89 FACT ev:EV-004
28. EVT-028 09:45:44 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.96 FACT ev:EV-005
29. EVT-029 09:46:02 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.96 FACT ev:EV-005
30. EVT-030 09:46:18 NETWORK_CONNECTION analyst01 203.0.113.47:8080 confidence:0.95 FACT ev:EV-005
31. EVT-031 09:46:35 AUTHENTICATION_FAILURE actor:SYSTEM target:analyst01@WS-104 confidence:0.94 FACT ev:EV-002
32. EVT-032 09:46:51 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
33. EVT-033 09:47:03 FILE_MODIFY analyst01 C:\\Users\\analyst01\\AppData\\Local\\Temp\\tmp_8a3f.ps1 confidence:0.91 FACT ev:EV-003
34. EVT-034 09:47:19 FILE_CREATE analyst01 C:\\Users\\analyst01\\AppData\\Local\\Temp\\svchost_helper.dll confidence:0.87 FACT ev:EV-003
35. EVT-035 09:47:44 FILE_MODIFY analyst01 C:\\Windows\\Temp\\~DF3A21.tmp confidence:0.85 FACT ev:EV-003
36. EVT-036 09:48:05 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\report_draft.docx confidence:0.84 FACT ev:EV-003
37. EVT-037 09:48:22 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
38. EVT-038 09:48:39 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\quarterly_review.docx confidence:0.83 FACT ev:EV-003
39. EVT-039 09:49:01 FILE_CREATE analyst01 C:\\Users\\analyst01\\AppData\\Roaming\\svcmon.exe confidence:0.86 FACT ev:EV-003
40. EVT-040 09:49:18 PROCESS_START analyst01 svcmon.exe confidence:0.85 FACT ev:EV-004
41. EVT-041 09:49:35 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
42. EVT-042 09:49:52 FILE_MODIFY analyst01 C:\\Users\\analyst01\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\svcmon.lnk confidence:0.88 FACT ev:EV-003
43. EVT-043 09:50:11 NETWORK_CONNECTION analyst01 8.8.8.8:53 confidence:0.91 FACT ev:EV-005
44. EVT-044 09:50:29 WEB_VISIT analyst01 www.google.com confidence:0.97 FACT ev:EV-001
45. EVT-045 09:51:04 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
46. EVT-046 09:51:22 EMAIL_SENT analyst01 to:team@company.internal subject:"Re: Q3 meeting" confidence:0.96 FACT ev:EV-006
47. EVT-047 09:52:07 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
48. EVT-048 09:52:44 AUTHENTICATION_FAILURE actor:SYSTEM target:analyst01@WS-104 confidence:0.93 FACT ev:EV-002
49. EVT-049 09:53:01 NETWORK_CONNECTION analyst01 172.16.5.22:445 confidence:0.89 FACT ev:EV-005
50. EVT-050 09:53:18 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
51. EVT-051 09:53:52 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\financial_projections_2026.xlsx confidence:0.82 FACT ev:EV-003
52. EVT-052 09:54:14 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\hr_contacts.xlsx confidence:0.82 FACT ev:EV-003
53. EVT-053 09:54:38 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.95 FACT ev:EV-005
54. EVT-054 09:55:02 FILE_CREATE analyst01 C:\\Users\\analyst01\\AppData\\Local\\Temp\\out_8841.zip confidence:0.87 FACT ev:EV-003
55. EVT-055 09:55:19 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.94 FACT ev:EV-005
56. EVT-056 09:55:44 FILE_UPLOAD analyst01 out_8841.zip to:203.0.113.47 confidence:0.78 INFERENCE ev:EV-005
57. EVT-057 09:56:03 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.94 FACT ev:EV-005
58. EVT-058 09:56:28 WEB_VISIT analyst01 support.microsoft.com confidence:0.97 FACT ev:EV-001
59. EVT-059 09:57:01 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.93 FACT ev:EV-005
60. EVT-060 09:57:38 NETWORK_CONNECTION analyst01 203.0.113.47:8080 confidence:0.93 FACT ev:EV-005
61. EVT-061 09:58:14 FILE_MODIFY analyst01 C:\\Windows\\System32\\drivers\\etc\\hosts confidence:0.81 FACT ev:EV-003
62. EVT-062 09:58:49 PROCESS_END analyst01 WINWORD.EXE confidence:0.96 FACT ev:EV-004
63. EVT-063 09:59:12 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.93 FACT ev:EV-005
64. EVT-064 09:59:45 PROCESS_END analyst01 cmd.exe confidence:0.92 FACT ev:EV-004
65. EVT-065 10:00:03 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.93 FACT ev:EV-005
66. EVT-066 10:00:31 FILE_MODIFY analyst01 C:\\Users\\analyst01\\AppData\\Roaming\\svcmon.exe confidence:0.84 FACT ev:EV-003
67. EVT-067 10:00:58 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.92 FACT ev:EV-005
68. EVT-068 10:01:22 AUTHENTICATION_SUCCESS actor:SYSTEM target:analyst01@WS-104 confidence:0.94 FACT ev:EV-002
69. EVT-069 10:02:07 PROCESS_END analyst01 powershell.exe confidence:0.91 FACT ev:EV-004
70. EVT-070 10:02:34 NETWORK_CONNECTION analyst01 203.0.113.47:443 confidence:0.91 FACT ev:EV-005
71. EVT-071 10:02:58 PROCESS_END analyst01 svcmon.exe confidence:0.88 FACT ev:EV-004
72. EVT-072 10:03:19 WEB_VISIT analyst01 news.bbc.co.uk confidence:0.98 FACT ev:EV-001
73. EVT-073 10:03:47 EMAIL_RECEIVED analyst01 from:it-alerts@company.internal subject:"Scheduled maintenance tonight" confidence:0.97 FACT ev:EV-006
74. EVT-074 10:04:12 NETWORK_CONNECTION analyst01 172.16.0.5:443 confidence:0.95 FACT ev:EV-005
75. EVT-075 10:05:02 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\report_draft.docx confidence:0.96 FACT ev:EV-003
76. EVT-076 10:06:11 WEB_VISIT analyst01 outlook.office.com confidence:0.97 FACT ev:EV-001
77. EVT-077 10:07:33 PROCESS_START analyst01 EXCEL.EXE confidence:0.97 FACT ev:EV-004
78. EVT-078 10:08:15 FILE_MODIFY analyst01 C:\\Users\\analyst01\\Documents\\financial_projections_2026.xlsx confidence:0.95 FACT ev:EV-003
79. EVT-079 10:09:41 SEARCH analyst01 "invoice portal phishing" confidence:0.96 FACT ev:EV-001
80. EVT-080 10:10:05 AUTH LOGOUT analyst01 WS-104 confidence:0.99 FACT ev:EV-002
  `;
    const lines = rawEvents.split('\n').map(l => l.trim()).filter(l => l.match(/^\d+\./));
    for (const line of lines) {
        const parts = line.split(' ');
        const id = parts[1];
        const ts = '2026-09-10T' + parts[2] + 'Z';
        const evType = parts[3];
        let actor = parts[4] === 'actor:SYSTEM' ? 'SYSTEM' : parts[4];
        let offset = parts[4] === 'actor:SYSTEM' ? 5 : 5;
        if (evType === 'AUTH' && parts[4] === 'LOGIN' || parts[4] === 'LOGOUT') {
            actor = parts[5];
            offset = 6;
        }
        let confidenceIdx = parts.findIndex(p => p.startsWith('confidence:'));
        let conf = parseFloat(parts[confidenceIdx].split(':')[1]);
        let classif = parts[confidenceIdx + 1];
        let evId = parts[confidenceIdx + 2].split(':')[1];
        let descTokens = parts.slice(offset, confidenceIdx);
        let desc = descTokens.join(' ');
        // source type inference
        let srcType = 'unknown';
        const mapped = evidence.find(e => e.id === evId);
        if (mapped)
            srcType = mapped.src;
        (0, db_1.runQuery)("INSERT INTO events (id, case_id, timestamp, timestamp_confidence, source_type, event_type, actor, description, confidence, evidence_refs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            id, 'CASE-2026-014', ts, 1.0, srcType, evType, actor, desc, conf, JSON.stringify([evId])
        ]);
    }
    // Entities
    const entities = [
        ['ENT-001', 'user', 'analyst01', '09:28:14', '10:10:05'],
        ['ENT-002', 'device', 'WS-104', '09:28:14', '10:10:05'],
        ['ENT-003', 'domain', 'secure-invoice-portal.net', '09:42:38', '09:43:09'],
        ['ENT-004', 'file', 'invoice_q3_2026.docm', '09:43:22', '09:44:31'],
        ['ENT-005', 'process', 'cmd.exe', '09:45:02', '10:00:31'],
        ['ENT-006', 'process', 'powershell.exe', '09:45:14', '10:02:07'],
        ['ENT-007', 'ip', '203.0.113.47', '09:45:44', '10:02:34'],
        ['ENT-008', 'file', 'svcmon.exe', '09:49:01', '10:00:31'],
        ['ENT-009', 'file', 'out_8841.zip', '09:55:02', '09:55:44'],
        ['ENT-010', 'ip', '172.16.5.22', '09:53:01', '09:53:01'],
        ['ENT-011', 'email', 'billing@secure-invoice-portal.net', '09:42:07', '09:42:07'],
        ['ENT-012', 'file', 'svchost_helper.dll', '09:47:19', '09:47:19']
    ];
    for (const ent of entities) {
        (0, db_1.runQuery)("INSERT INTO entities (id, case_id, type, value, first_seen, last_seen) VALUES (?, ?, ?, ?, ?, ?)", [
            ent[0], 'CASE-2026-014', ent[1], ent[2], '2026-09-10T' + ent[3] + 'Z', '2026-09-10T' + ent[4] + 'Z'
        ]);
    }
    // Findings
    const findings = [
        ['H-001', "analyst01 received a phishing email and subsequently visited the sender's domain, downloaded a macro-enabled document, and opened it in Microsoft Word.", 'CORRELATED', 0.91, JSON.stringify(['EV-001', 'EV-002', 'EV-003', 'EV-006']), 'pending', "EV-001,EV-002,EV-003,EV-006, events: EVT-016,EVT-017,EVT-019,EVT-020,EVT-021,EVT-023", "No direct evidence that analyst01 recognized the email as phishing at time of opening"],
        ['H-002', "A child process (cmd.exe) was spawned during or after the Word document was opened, consistent with macro execution.", 'INFERENCE', 0.78, JSON.stringify(['EV-003', 'EV-004']), 'pending', "EV-003,EV-004, events: EVT-023,EVT-025,EVT-026,EVT-027", "Parent-child process relationship not recorded in available telemetry. cmd.exe start cannot be definitively attributed to WINWORD.EXE."],
        ['H-003', "The workstation established repeated outbound connections to external IP 203.0.113.47 on ports 443 and 8080 over a period of approximately 17 minutes, consistent with C2 beaconing behavior.", 'CORRELATED', 0.85, JSON.stringify(['EV-004', 'EV-005']), 'pending', "EV-004,EV-005, events: EVT-028,EVT-029,EVT-030,EVT-032,EVT-037,EVT-041,EVT-045,EVT-047", "Network payload content not captured. Connection purpose cannot be confirmed from metadata alone."],
        ['H-004', "Files including financial_projections_2026.xlsx and hr_contacts.xlsx were accessed and a ZIP archive was created, followed by a large outbound connection. Data exfiltration is possible but not confirmed.", 'INFERENCE', 0.62, JSON.stringify(['EV-003', 'EV-005']), 'pending', "EV-003,EV-005, events: EVT-051,EVT-052,EVT-054,EVT-056", "No DLP or payload capture confirms data transfer. File access may be coincidental. Upload inference is based on connection size metadata only."]
    ];
    for (const f of findings) {
        (0, db_1.runQuery)("INSERT INTO findings (id, case_id, description, classification, confidence, evidence_refs, status, supporting, contradicting) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
            f[0], 'CASE-2026-014', f[1], f[2], f[3], f[4], f[5], f[6], f[7]
        ]);
    }
    // Questions
    const questions = [
        ['Q-1', "How did the suspicious file enter the system?", "Via email from billing@secure-invoice-portal.net at 09:42:07, followed by browser download at 09:43:22.", 0.91, JSON.stringify(['EV-001', 'EV-006']), "Email attachment metadata; whether link was clicked or URL manually typed"],
        ['Q-2', "Was invoice_q3_2026.docm executed?", "Yes. WINWORD.EXE was observed launching with the document as argument at 09:44:18.", 0.97, JSON.stringify(['EV-003', 'EV-004']), "Macro execution confirmation; Office macro security settings"],
        ['Q-3', "Was a child process spawned from the document?", "Likely. cmd.exe appeared at 09:45:02 within 44 seconds of Word opening the document, but parent-child relationship is not recorded.", 0.74, JSON.stringify(['EV-004']), "Process creation telemetry with parent PID; Sysmon or EDR data"],
        ['Q-4', "What is 203.0.113.47?", "An external IP address not belonging to the organization. 12 outbound connections were recorded over 17 minutes. Organization attribution unknown.", 0.96, JSON.stringify(['EV-005']), "Threat intelligence data; WHOIS/ASN attribution; payload content"],
        ['Q-5', "Was data exfiltrated?", "Possible but not confirmed. Sensitive files were accessed and a ZIP was created before a large outbound connection, but no payload capture confirms transfer.", 0.62, JSON.stringify(['EV-003', 'EV-005']), "DLP logs; network packet capture; file access audit with byte counts"],
        ['Q-6', "Was persistence established?", "Likely. svcmon.exe was created in AppData\\\\Roaming and a shortcut was placed in the Startup folder at 09:49:52.", 0.83, JSON.stringify(['EV-003', 'EV-004']), "Registry run key audit; scheduled task logs"],
        ['Q-7', "Did the user recognize the phishing attempt?", "Possibly. The user searched 'invoice portal phishing' at 10:09:41 after the C2 connections stopped, suggesting retrospective awareness.", 0.71, JSON.stringify(['EV-001']), "User interview; IT helpdesk ticket; whether user reported the incident"]
    ];
    for (const q of questions) {
        (0, db_1.runQuery)("INSERT INTO questions (id, case_id, text, answer, confidence, evidence_refs, missing_evidence) VALUES (?, ?, ?, ?, ?, ?, ?)", [
            q[0], 'CASE-2026-014', q[1], q[2], q[3], q[4], q[5]
        ]);
    }
};
exports.seedDemoCase = seedDemoCase;
