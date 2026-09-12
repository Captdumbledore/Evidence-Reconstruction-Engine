import { useState } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

export const TimelineStrip = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-inv-surface border border-b-0 border-inv-border rounded-t-lg px-4 py-1 cursor-pointer flex items-center gap-2 z-10" onClick={() => setIsOpen(true)}>
        <Clock size={12} className="text-inv-muted" />
        <span className="text-xs font-mono text-inv-muted">TIMELINE</span>
        <ChevronUp size={14} className="text-inv-muted" />
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-inv-surface border-t border-inv-border z-10 flex flex-col shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-inv-border bg-inv-bg/50">
        <div className="flex items-center gap-2">
          <Clock size={12} className="text-inv-muted" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-inv-muted">INVESTIGATION TIMELINE</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-inv-muted hover:text-white">
          <ChevronDown size={14} />
        </button>
      </div>
      <div className="flex-1 relative overflow-x-auto p-4 flex items-center">
        {/* Timeline track */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-inv-border -translate-y-1/2" />
        
        {/* Timeline items */}
        <div className="relative z-10 flex items-center gap-12 min-w-max px-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="text-[10px] font-mono text-inv-muted group-hover:text-inv-text">09:42:0{i}</div>
              <div className="w-3 h-3 rounded-full bg-inv-red border-2 border-inv-surface group-hover:scale-125 transition-transform" />
              <div className="text-xs text-inv-muted group-hover:text-inv-text whitespace-nowrap">Event {i}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
