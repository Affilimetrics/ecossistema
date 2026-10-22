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
import RemarketingPage from './dashboardv2/remarketing';
import SettingsPage from './dashboardv2/settings';
import CentralDivulgacao from './dashboardv2/central-divulgacao';
import ProductsPage from './dashboardv2/products';

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

const RemarketingPageWrapper = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <RemarketingPage isDark={isDark} setIsDark={setIsDark} />;
};

const SettingsPageWrapper = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <SettingsPage isDark={isDark} setIsDark={setIsDark} />;
};

const CentralDivulgacaoWrapper = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <CentralDivulgacao isDark={isDark} setIsDark={setIsDark} />;
};

const ProductsPageWrapper = () => {
  const { isDark, setIsDark } = useDarkMode();
  return <ProductsPage isDark={isDark} setIsDark={setIsDark} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignInSide />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboardv2" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPageWrapper />} />
            <Route path="/hot-products" element={<HotProductsPage />} />
            <Route path="/coleta-geral" element={<ColetaGeralPage />} />
            <Route path="/remarketing" element={<RemarketingPageWrapper />} />
            <Route path="/settings" element={<SettingsPageWrapper />} />
            <Route path="/divulgacao" element={<CentralDivulgacaoWrapper />} />
          </Route>
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/marketing" element={<MarketingPage />} />
        </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  </React.StrictMode>
);