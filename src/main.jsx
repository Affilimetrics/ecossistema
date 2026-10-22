import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './styles.css';

// Autenticação e Páginas Públicas
import SignInSide from './pages/auth/sign-in-side/SignInSide';
import SignUp from './pages/auth/sign-up/SignUp';
import MarketingPage from './pages/marketing-page/MarketingPage';

// Componentes de Layout do Dashboard
import {
  DashboardShell,
  DarkModeProvider,
  ExampleContent,
  useDarkMode,
} from './components/layout/dashboard-with-collapsible-sidebar';

// Páginas do Dashboard
import HotProductsContent from './pages/dashboard/hot-products';
import ColetaGeral from './pages/dashboard/coleta-geral';
import RemarketingPage from './pages/dashboard/remarketing';
import SettingsPage from './pages/dashboard/settings';
import CentralDivulgacao from './pages/dashboard/central-divulgacao';
import ProductsPage from './pages/dashboard/products';

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