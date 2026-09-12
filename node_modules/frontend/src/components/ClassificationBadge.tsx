import React from 'react';
import { CheckCircle2, Link2, AlertTriangle, HelpCircle } from 'lucide-react';

type Classification = 'FACT' | 'CORRELATED' | 'INFERENCE' | 'UNKNOWN';

const config: Record<Classification, { icon: any; label: string; cls: string }> = {
  FACT: { icon: CheckCircle2, label: 'FACT', cls: 'badge-fact' },
  CORRELATED: { icon: Link2, label: 'CORRELATED', cls: 'badge-correlated' },
  INFERENCE: { icon: AlertTriangle, label: 'INFERENCE', cls: 'badge-inference' },
  UNKNOWN: { icon: HelpCircle, label: 'UNKNOWN', cls: 'badge-unknown' },
};

export const ClassificationBadge: React.FC<{ classification: Classification }> = ({ classification }) => {
  const { icon: Icon, label, cls } = config[classification] ?? config.UNKNOWN;
  return (
    <span className={cls}>
      <Icon size={10} />
      {label}
    </span>
  );
};
