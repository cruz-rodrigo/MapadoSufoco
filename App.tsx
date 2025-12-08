import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { ClientLayout } from './views/client/ClientLayout';
import { Overview } from './views/client/Overview';
import { ImportView } from './views/client/ImportView';
import { ClassificationView } from './views/client/ClassificationView';
import { DebtsView } from './views/client/DebtsView';
import { AnalysisView } from './views/client/AnalysisView';
import { CashFlowView } from './views/client/CashFlowView';
import { ProjectionView } from './views/client/ProjectionView';
import { ReportView } from './views/client/ReportView';
import { ProblemTreeView } from './views/client/ProblemTreeView';

const App = () => {
  return (
    <DataProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/client/:clientId" element={<ClientLayout />}>
              <Route index element={<Overview />} />
              <Route path="import" element={<ImportView />} />
              <Route path="classification" element={<ClassificationView />} />
              <Route path="debts" element={<DebtsView />} />
              <Route path="analysis" element={<AnalysisView />} />
              <Route path="cashflow" element={<CashFlowView />} />
              <Route path="projection" element={<ProjectionView />} />
              <Route path="report" element={<ReportView />} />
              <Route path="problem-tree" element={<ProblemTreeView />} />
            </Route>

          </Routes>
        </Layout>
      </HashRouter>
    </DataProvider>
  );
};

export default App;