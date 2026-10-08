import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './styles.css';
import SignInSide from './sign-in-side/SignInSide';
import SignUp from './sign-up/SignUp';
import MarketingPage from './marketing-page/MarketingPage';
import {
  DashboardShell,
  DarkModeProvider,
  ExampleContent,
  useDarkMode,
} from './dashboardv2/dashboard-with-collapsible-sidebar';
import HotProductsContent from './dashboardv2/hot-products';
import ColetaGeral from './dashboardv2/coleta-geral';

// Layout único: a sidebar e o tema permanecem ao trocar de rota.
const DashboardLayout = () => {
  const { isDark, setIsDark } = useDarkMode();
  return (
    <DashboardShell isDark={isDark} setIsDark={setIsDark}>
      <Outlet />
    </DashboardShell>
  );
};

const DashboardPage = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <ExampleContent isDark={isDark} setIsDark={setIsDark} />;
};

const HotProductsPage = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <HotProductsContent isDark={isDark} setIsDark={setIsDark} />;
};

const ColetaGeralPage = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <ColetaGeral isDark={isDark} setIsDark={setIsDark} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignInSide />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboardv2" element={<DashboardPage />} />
            <Route path="/produtos-quentes" element={<HotProductsPage />} />
            <Route path="/coleta-geral" element={<ColetaGeralPage />} />
          </Route>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/marketing" element={<MarketingPage />} />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  </React.StrictMode>
);