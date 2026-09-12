import { useEffect, useState } from 'react';
import { useCaseStore } from '../../store/caseStore';

export const CaseIntro = ({ onComplete }: { onComplete: () => void }) => {
  const { currentCase } = useCaseStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(() => setStep(3), 3500);
    const t4 = setTimeout(() => onComplete(), 5000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div 
      className="absolute inset-0 bg-inv-bg z-50 flex items-center justify-center cursor-pointer"
      onClick={onComplete}
    >
      <div className="max-w-2xl w-full p-8 text-center">
        <div className={`transition-all duration-700 ${step >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-inv-red font-mono text-sm tracking-[0.3em] mb-4">RECONSTRUCT</div>
          <h1 className="text-4xl font-mono font-bold text-white mb-2">{currentCase?.id || 'CASE-INITIALIZING'}</h1>
          <h2 className="text-xl text-inv-muted uppercase tracking-wider">{currentCase?.name || 'Loading case data...'}</h2>
        </div>

        <div className="mt-12 space-y-4 font-mono text-sm">
          <div className={`transition-all duration-500 ${step >= 1 ? 'opacity-100' : 'opacity-0'} flex items-center justify-center gap-3`}>
            <span className="text-inv-muted">Scanning evidence sources...</span>
            <span className="text-green-400">6 sources detected</span>
          </div>
          <div className={`transition-all duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-0'} flex items-center justify-center gap-3`}>
            <span className="text-inv-muted">Normalizing timeline...</span>
            <span className="text-green-400">80 events indexed</span>
          </div>
          <div className={`transition-all duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-0'} flex items-center justify-center gap-3`}>
            <span className="text-inv-muted">Running correlation engine...</span>
            <span className="text-inv-red-bright font-bold">3 potential relationship clusters found</span>
          </div>
        </div>

        <div className={`absolute bottom-12 left-1/2 -translate-x-1/2 text-xs font-mono text-inv-muted transition-opacity duration-1000 ${step >= 1 ? 'opacity-100 animate-pulse' : 'opacity-0'}`}>
          Click anywhere to skip
        </div>
      </div>
    </div>
  );
};
