const fs = require('fs');
const path = require('path');

const root = __dirname;
const fSrc = path.join(root, 'packages/frontend/src');
function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

ensureDir(path.join(fSrc, 'components', 'layout'));
ensureDir(path.join(fSrc, 'pages'));
ensureDir(path.join(fSrc, 'lib'));

fs.writeFileSync(path.join(fSrc, 'lib', 'api.ts'), `
export const api = {
  getCases: () => fetch('http://localhost:3000/api/cases').then(res => res.json()),
  getCase: (id: string) => fetch(\`http://localhost:3000/api/cases/\${id}\`).then(res => res.json())
};
`);

fs.writeFileSync(path.join(fSrc, 'components', 'layout', 'Layout.tsx'), `
import React from 'react';
import { Outlet } from 'react-router-dom';
export const Layout = () => (
  <div><Outlet /></div>
);
`);

fs.writeFileSync(path.join(fSrc, 'pages', 'Landing.tsx'), `
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
export const Landing = () => {
  const [cases, setCases] = useState<any[]>([]);
  useEffect(() => {
    api.getCases().then(setCases).catch(console.error);
  }, []);
  return (
    <div>
      <h1>RECONSTRUCT</h1>
      <div>
        {cases.map(c => (
          <Link key={c.id} to={\`/cases/\${c.id}\`}>{c.name}</Link>
        ))}
      </div>
    </div>
  );
};
`);

fs.writeFileSync(path.join(fSrc, 'pages', 'CaseOverview.tsx'), `
import React from 'react';
export const CaseOverview = () => (
  <div>Case Overview</div>
);
`);

fs.writeFileSync(path.join(fSrc, 'App.tsx'), `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Landing } from './pages/Landing';
import { CaseOverview } from './pages/CaseOverview';

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/cases/:id/*" element={<Layout />}>
        <Route index element={<CaseOverview />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
export default App;
`);

fs.writeFileSync(path.join(fSrc, 'main.tsx'), `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
`);

console.log('Frontend skeleton created.');
