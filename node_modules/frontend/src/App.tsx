import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Layout } from './components/layout/Layout';
import { InvestigationBoard } from './pages/InvestigationBoard';
import { Evidence } from './pages/Evidence';
import { Timeline } from './pages/Timeline';
import { EvidenceGraph } from './pages/EvidenceGraph';
import { Findings } from './pages/Findings';
import { Questions } from './pages/Questions';
import { Reports } from './pages/Reports';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/cases/:id" element={<Layout />}>
          <Route index element={<InvestigationBoard />} />
          <Route path="board" element={<InvestigationBoard />} />
          <Route path="evidence" element={<Evidence />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="graph" element={<EvidenceGraph />} />
          <Route path="findings" element={<Findings />} />
          <Route path="questions" element={<Questions />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
