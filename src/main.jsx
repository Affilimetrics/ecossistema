import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';
import SignInSide from './sign-in-side/SignInSide';
import SignUp from './sign-up/SignUp';
import MarketingPage from './marketing-page/MarketingPage';
import { Example as DashboardV2 } from './dashboardv2/dashboard-with-collapsible-sidebar';
import HotProductsContent from './dashboardv2/hot-products';
import ColetaGeral from './dashboardv2/coleta-geral';
import { DashboardShell, useDarkMode } from './dashboardv2/dashboard-with-collapsible-sidebar';

const HotProductsPage = () => {
  const { isDark, setIsDark } = useDarkMode();
  return (
    <DashboardShell isDark={isDark} setIsDark={setIsDark}>
      <HotProductsContent isDark={isDark} setIsDark={setIsDark} />
    </DashboardShell>
  );
};

const ColetaGeralPage = () => {
  const { isDark, setIsDark } = useDarkMode();
  return (
    <DashboardShell isDark={isDark} setIsDark={setIsDark}>
      <ColetaGeral isDark={isDark} setIsDark={setIsDark} />
    </DashboardShell>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignInSide />} />
        <Route path="/dashboardv2" element={<DashboardV2 />} />
        <Route path="/produtos-quentes" element={<HotProductsPage />} />
        <Route path="/coleta-geral" element={<ColetaGeralPage />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/marketing" element={<MarketingPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);