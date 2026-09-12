import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const EvidenceChip: React.FC<{ id: string }> = ({ id }) => {
  const navigate = useNavigate();
  const { id: caseId } = useParams();
  return (
    <button
      onClick={() => navigate(`/cases/${caseId}/evidence?highlight=${id}`)}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/60 text-xs font-mono hover:bg-blue-900 hover:border-blue-600 transition-colors"
    >
      <FileText size={10} />
      {id}
    </button>
  );
};
