import React, { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useCaseStore } from '../../store/caseStore';
import { InvestigationToolbar } from './InvestigationToolbar';

export const Layout: React.FC = () => {
  const { id } = useParams();
  const { setCurrentCase } = useCaseStore();

  useEffect(() => {
    if (id) api.getCase(id).then(setCurrentCase);
  }, [id, setCurrentCase]);

  return (
    <div className="flex h-screen bg-inv-bg text-inv-text overflow-hidden font-sans print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <InvestigationToolbar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 relative print:block">
        <main className="flex-1 overflow-y-auto relative print:overflow-visible">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
