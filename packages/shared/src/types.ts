
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
