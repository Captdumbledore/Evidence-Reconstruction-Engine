# RECONSTRUCT — Digital Evidence Reconstruction Platform

A full-stack web application for digital forensics investigation. Upload evidence artifacts, and the system parses, normalizes, correlates, and reconstructs events into a timeline + relationship graph with transparent confidence scoring and FACT/CORRELATED/INFERENCE/UNKNOWN classification.

## Quick Start

**Prerequisites**: Node.js >= 18, npm >= 9

```bash
npm install
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

The demo case **CASE-2026-014 - Suspicious Document Execution** is auto-seeded on first run. No manual setup required.

## Demo Workflow

1. Open http://localhost:5173
2. Click **CASE-2026-014 - Suspicious Document Execution**
3. **Overview** - read the investigation narrative, stats, and audit trail
4. **Timeline** - explore 80 events across 6 lanes; click any event to see details and evidence refs
5. **Evidence Graph** - pan/zoom the relationship graph; click nodes for entity details
6. **Findings** - review 4 hypotheses with CORRELATED/INFERENCE classification; accept/reject them
7. **Investigation Questions** - 7 forensic questions with evidence-grounded answers
8. **Reports** - generate and download HTML/JSON/CSV report

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand |
| Graph | @xyflow/react (React Flow v12) |
| Backend | Node.js, Express, TypeScript |
| Database | sql.js (pure WebAssembly SQLite - no native build required) |
| Correlation | Deterministic rule-based engine (no LLM required) |

## Classification System

| Label | Meaning |
|-------|---------|
| FACT | Directly observed in evidence |
| CORRELATED | Multiple independent artifacts align |
| INFERENCE | Reasoned interpretation |
| UNKNOWN | Evidence insufficient |
