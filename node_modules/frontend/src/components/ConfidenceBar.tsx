import React from 'react';

export const ConfidenceBar: React.FC<{ confidence: number; showLabel?: boolean }> = ({ confidence, showLabel = true }) => {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && <span className="text-xs font-mono font-semibold" style={{ color }}>{pct}%</span>}
    </div>
  );
};
